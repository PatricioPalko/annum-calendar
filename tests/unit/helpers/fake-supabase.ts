/**
 * Minimal in-memory stand-in for the supabase-js query builder, covering the
 * chains used by the order and payment code: select / update / delete with
 * eq / neq / is filters, `.select()` returning rows, `.single()`,
 * `.maybeSingle()` and awaiting the builder directly.
 *
 * Each terminal call applies its filters and mutation in one synchronous step,
 * which mirrors how Postgres applies a conditional UPDATE atomically per row.
 */
type Row = Record<string, unknown>;

type QueryResult<T> = { data: T; error: null } | { data: null; error: { message: string } };

class FakeQuery {
  private operation: "select" | "update" | "delete" = "select";
  private patch: Row = {};
  private filters: Array<(row: Row) => boolean> = [];

  constructor(
    private readonly table: Row[],
    private readonly failWith: string | null,
  ) {}

  select() {
    return this;
  }

  update(patch: Row) {
    this.operation = "update";
    this.patch = patch;
    return this;
  }

  delete() {
    this.operation = "delete";
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  neq(column: string, value: unknown) {
    this.filters.push((row) => row[column] !== value);
    return this;
  }

  is(column: string, value: unknown) {
    this.filters.push((row) => (row[column] ?? null) === value);
    return this;
  }

  private run(): QueryResult<Row[]> {
    if (this.failWith) {
      return { data: null, error: { message: this.failWith } };
    }

    const matched = this.table.filter((row) =>
      this.filters.every((filter) => filter(row)),
    );

    if (this.operation === "update") {
      for (const row of matched) {
        Object.assign(row, this.patch);
      }
    }

    if (this.operation === "delete") {
      for (const row of matched) {
        this.table.splice(this.table.indexOf(row), 1);
      }
    }

    return { data: matched.map((row) => ({ ...row })), error: null };
  }

  async maybeSingle(): Promise<QueryResult<Row | null>> {
    const result = this.run();
    return result.error ? result : { data: result.data[0] ?? null, error: null };
  }

  async single(): Promise<QueryResult<Row>> {
    const result = this.run();

    if (result.error) {
      return result;
    }

    return result.data.length === 1
      ? { data: result.data[0]!, error: null }
      : { data: null, error: { message: "JSON object requested, multiple (or no) rows returned" } };
  }

  then<TResult1 = QueryResult<Row[]>, TResult2 = never>(
    onFulfilled?: ((value: QueryResult<Row[]>) => TResult1 | PromiseLike<TResult1>) | null,
    onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return Promise.resolve(this.run()).then(onFulfilled, onRejected);
  }
}

export function createFakeSupabase() {
  const tables: Record<string, Row[]> = { orders: [] };
  const storageRemove: Array<string[]> = [];
  let failNextQueryWith: string | null = null;

  const client = {
    from(table: string) {
      tables[table] ??= [];
      const failWith = failNextQueryWith;
      failNextQueryWith = null;
      return new FakeQuery(tables[table]!, failWith);
    },
    storage: {
      from() {
        return {
          async remove(paths: string[]) {
            storageRemove.push(paths);
            return { data: [], error: null };
          },
        };
      },
    },
  };

  return {
    client,
    tables,
    storageRemove,
    /** Makes the next `from()` query return a database error. */
    failNextQuery(message = "simulated database error") {
      failNextQueryWith = message;
    },
    reset() {
      tables.orders = [];
      storageRemove.length = 0;
      failNextQueryWith = null;
    },
  };
}
