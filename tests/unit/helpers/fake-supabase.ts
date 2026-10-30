/**
 * Minimal in-memory stand-in for the supabase-js query builder, covering the
 * chains used by the order and payment code: select / insert / update /
 * delete with eq / neq / is / lt / gt / or (`col.is.null` and `col.eq.value`
 * terms) filters, order / limit, `.select()` returning rows, `.single()`,
 * `.maybeSingle()` and awaiting the builder directly.
 *
 * Each terminal call applies its filters and mutation in one synchronous step,
 * which mirrors how Postgres applies a conditional UPDATE atomically per row.
 */
type Row = Record<string, unknown>;

type QueryResult<T> = { data: T; error: null } | { data: null; error: { message: string } };

class FakeQuery {
  private operation: "select" | "insert" | "update" | "delete" = "select";
  private patch: Row = {};
  private inserted: Row[] = [];
  private filters: Array<(row: Row) => boolean> = [];
  private sort: { column: string; ascending: boolean } | null = null;
  private maxRows: number | null = null;

  constructor(
    private readonly table: Row[],
    private readonly failWith: string | null,
    private readonly nextId: () => string,
  ) {}

  select() {
    return this;
  }

  insert(rows: Row | Row[]) {
    this.operation = "insert";
    this.inserted = Array.isArray(rows) ? rows : [rows];
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

  lt(column: string, value: string | number) {
    this.filters.push((row) => row[column] !== null && row[column] !== undefined && (row[column] as string | number) < value);
    return this;
  }

  gt(column: string, value: string | number) {
    this.filters.push((row) => row[column] !== null && row[column] !== undefined && (row[column] as string | number) > value);
    return this;
  }

  /** Supports PostgREST `or` terms of the form `col.is.null` and `col.eq.value`. */
  or(expression: string) {
    const terms = expression.split(",").map((term) => {
      const [column, operator, ...rest] = term.split(".");
      const value = rest.join(".");

      if (operator === "is" && value === "null") {
        return (row: Row) => (row[column!] ?? null) === null;
      }

      if (operator === "eq") {
        return (row: Row) => String(row[column!]) === value;
      }

      throw new Error(`fake-supabase: unsupported or() term "${term}"`);
    });

    this.filters.push((row) => terms.some((term) => term(row)));
    return this;
  }

  order(column: string, options: { ascending?: boolean } = {}) {
    this.sort = { column, ascending: options.ascending ?? true };
    return this;
  }

  limit(count: number) {
    this.maxRows = count;
    return this;
  }

  private run(): QueryResult<Row[]> {
    if (this.failWith) {
      return { data: null, error: { message: this.failWith } };
    }

    if (this.operation === "insert") {
      const rows = this.inserted.map((row) => ({ id: this.nextId(), ...row }));
      this.table.push(...rows);
      return { data: rows.map((row) => ({ ...row })), error: null };
    }

    let matched = this.table.filter((row) =>
      this.filters.every((filter) => filter(row)),
    );

    if (this.sort) {
      const { column, ascending } = this.sort;
      matched = [...matched].sort((a, b) => {
        const left = a[column] as string | number;
        const right = b[column] as string | number;
        return (left < right ? -1 : left > right ? 1 : 0) * (ascending ? 1 : -1);
      });
    }

    if (this.maxRows !== null) {
      matched = matched.slice(0, this.maxRows);
    }

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
  let idCounter = 0;
  const nextId = () => `generated-${++idCounter}`;

  const client = {
    from(table: string) {
      tables[table] ??= [];
      const failWith = failNextQueryWith;
      failNextQueryWith = null;
      return new FakeQuery(tables[table]!, failWith, nextId);
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
      idCounter = 0;
    },
  };
}
