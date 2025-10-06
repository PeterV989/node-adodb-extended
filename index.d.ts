declare module 'node-adodb-extended' {
  let PATH: string;
  const open: (connection: string, x64?: boolean) => open;

  export interface open {
    query<T>(sql: string): Promise<T>;
    query_v2<T>(sql: string, FetchArrays?: boolean): Promise<T>;
    execute<T>(sql: string, scalar?: string): Promise<T>;
    transaction<T>(sql: string[]): Promise<T>;
    schema<T>(type: number, criteria?: any[], id?: string): Promise<T>;
  }
}

// These are the types and interfaces returned by the query and query_v2 methods
export type ColumnValue = (string | number | boolean | Date | null);
export type RowValues = ColumnValue[];
// The following type is also returned by the original query() method
export type InnerObject = Record<string, ColumnValue>;


interface ISQLInnerArray {
  FieldMetaData: {
    FieldNames: string[],
    FieldTypes: number[]
  }
  ResultSet: RowValues[];
};

export interface ISQLArray {
  type: true,	// FetchArray = true
  ResultSet: ISQLInnerArray;
}

export interface ISQLObject {
  type: false,	// FetchArray = false
  ResultSet: InnerObject
};

export type SQLResults = ISQLArray | ISQLObject;
