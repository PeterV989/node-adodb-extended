# node-adodb-extended

> A node.js javascript client implementing the ADODB protocol on windows.
>
> NOTE: This is a community maintained version which has been updated to add
> other formats returned by the query. My heartfelt thanks go to the original
> author, **niuntun** whose work is being extended, not replaced. Thank you **niuntun** for
> your efforts.
>
> [![NPM Version][npm-image]][npm-url]
> [![Download Status][download-image]][npm-url]
> [![Windows Status][appveyor-image]][appveyor-url]
> [![Test Coverage][coveralls-image]][coveralls-url]
> ![Node Version][node-image]
> [![Dependencies][david-image]][david-url]

### Install

[![NPM](https://nodei.co/npm/node-adodb-extended.png)](https://nodei.co/npm/node-adodb-extended/)

### Introduction:

##### ES6

```js
'use strict';

const ADODB = require('node-adodb-extended');
const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source=node-adodb.mdb;');

// Transaction
connection
  .transaction([`INSERT INTO Users(UserId, UserName, UserSex, UserBirthday, UserMarried) VALUES (10, "Tom", "Male", "1981/5/10", 0);`,
          `INSERT INTO Users(UserId, UserName, UserSex, UserBirthday, UserMarried) VALUES (11, "Brenda", "Female", "2001/1/11", 0);`,
          `INSERT INTO Users(UserId, UserName, UserSex, UserBirthday, UserMarried) VALUES (10, "Bill", "Male", "1991/3/9", 0);`])
  .then(data => {
    console.log("We will not arrive because a duplicate id is generated. When encountering an error do not insert any record.");
  })
  .catch(error => {
    console.error(error);
  });

// Execute
connection
  .execute('INSERT INTO Users(UserName, UserSex, UserAge) VALUES ("Newton", "Male", 25)')
  .then(data => {
    console.log(JSON.stringify(data, null, 2));
  })
  .catch(error => {
    console.error(error);
  });

// Execute with scalar
connection
  .execute('INSERT INTO Users(UserName, UserSex, UserAge) VALUES ("Newton", "Male", 25)', 'SELECT @@Identity AS id')
  .then(data => {
    console.log(JSON.stringify(data, null, 2));
  })
  .catch(error => {
    console.error(error);
  });

// Query
connection
  .query('SELECT * FROM Users')
  .then(data => {
    console.log(JSON.stringify(data, null, 2));
  })
  .catch(error => {
    console.error(error);
  });

// Query with return as record type
connection
  .query_v2('SELECT * FROM Users', false)
  .then(data => {
    console.log(JSON.stringify(data, null, 2));
  })
  .catch(error => {
    console.error(error);
  });

// Query with return as array type
connection
  .query_v2('SELECT * FROM Users', true)
  .then(data => {
    console.log(JSON.stringify(data, null, 2));
  })
  .catch(error => {
    console.error(error);
  });

// Schema
connection
  .schema(20)
  .then(schema => {
    console.log(JSON.stringify(schema, null, 2));
  })
  .catch(error => {
    console.error(error);
  });
```

##### ES7 async/await

```js
'use strict';

const ADODB = require('node-adodb-extended');
const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source=node-adodb.mdb;');

async function query() {
  try {
    const users = await connection.query('SELECT * FROM Users');

    console.log(JSON.stringify(users, null, 2));
  } catch (error) {
    console.error(error);
  }
}

query();


async function query_v2(FetchArrays = false) {
  try {
    const users = await connection.query('SELECT * FROM Users', FetchArrays);

    console.log(JSON.stringify(users, null, 2));
  } catch (error) {
    console.error(error);
  }
}

query_v2(false);
// returns typed array of objects

query_v2(true);
// returns typed array of arrays along with field meta data
```

### API:

`ADODB.open(connection[, x64]): ADODB`

> Initialization database link parameters.

`ADODB.query(sql): Promise`

 > Execute SQL statement returning an array of objects (records).

`ADODB.query_v2(sql[, FetchArrays = false]): Promise`

> Execute a SQL statement that returns a typed structure.

> data['type'] == false:
> data['RecordSet'] is an array of objects.

> data['type'] == true:
> data['RecordSet']['FieldMetaData']['FieldName'] is an array of strings.
> data['RecordSet']['FieldMetaData']['FieldType'] is an array of number which are the ADO DataTypeEnum values.
> data['RecordSet']['RecordSet'] is an array of arrays.

`ADODB.execute(sql[, scalar]): Promise`

> Execute a SQL statement with no return value or with updated statistics.

`ADODB.transaction(sql[]): Promise`

> Execute multiple SQL statement as a transaction.

`ADODB.schema(type[, criteria][, id]): Promise`

> Query database schema information. see: [OpenSchema](https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/openschema-method)

### Debug:

> Set env `DEBUG=ADODB`, see: [debug](https://github.com/visionmedia/debug)

### Extension:

> This library theory supports all databases on the Windows platform that support ADODB connections, and only need to change the database connection string to achieve the operation! However, the Access Jet Engine requires the use of the Win32 OLE data provider. Use the x64 flag to control which bitness of the OLE Provider to use. [Note: This has no effect on the bitness of the app itself. An x64 app can still use the x32 version.]

> Common access connection strings:
>
> - Access 2000-2003 (\*.mdb): `Provider=Microsoft.Jet.OLEDB.4.0;Data Source=node-adodb.mdb;`
> - Access > 2007 (\*.accdb): `Provider=Microsoft.ACE.OLEDB.12.0;Data Source=adodb.accdb;Persist Security Info=False;` or `Provider=Microsoft.ACE.OLEDB.15.0;Data Source=adodb.accdb;Persist Security Info=False;`

### Notes:

> The library need system support `Microsoft.Jet.OLEDB.4.0` or `Microsoft.ACE.OLEDB.12.0`, `Windows XP SP2` above support `Microsoft.Jet.OLEDB.4.0` by default, Others need to install support! Must set x64 to false when accessing Jet (.mdb) databases.
>
> Recommended use `Microsoft.ACE.OLEDB.12.0`, download: [Microsoft.ACE.OLEDB.12.0](https://www.microsoft.com/en-us/download/details.aspx?id=13255)

### Electron

**ATTENTION: I have no means to test this with Electron. If you need Electron support, please reach out and I will make every effort to accomodate your needs.**

> If you want to use this module in an electron app running from an asar package you'll need to make some changes.

> 1. Move `adodb.js` outside the asar package (in this example I use electron-builder, the `extraResources` option can move the file outside the asar package)

```json
"extraResources": [
  {
    "from": "./node_modules/node-adodb-extended/lib/adodb.js",
    "to": "adodb.js"
  }
]
```

> 2. Tell the module where to find `adodb.js` while running from an asar package (I added this in electron's `main.js` file)

```javascript
// Are we running from inside an asar package ?
if (process.mainModule.filename.indexOf('app.asar') !== -1) {
  // In that case we need to set the correct path to adodb.js
  ADODB.PATH = './resources/adodb.js';
}
```

### Next modification

Finally, it is my strong desire to implement another method to allow the use of parameterized SQL
statements. This entails some thought as to how thorough I want to be in this endeavor. Simplistically, I would only implement a typed array of input parameters, nothing more. But, to
be thorough I would prefer to implement the full range of parameter options. Realisticly, I'm not
certain I know enough about other types of parameters (output, input-output, etc.) to understand
how to go about testing my interface. My recent experience with parameters involved VBA in Microsoft
Excel. There were a lot of hoops to jump through to add parameters.

### One final note

This package uses the Windows `cscript` command. Hence there is no C++ code to make this work. I
have no need for anything "production" ready. I am using this for a small custom server to
display data dashboards within our environment. As such, it works just fine for my needs. However,
I would not recommend it for anything with high traffic needs. In my use case I also use some
mutexes to limit the use to a single instance. Perhaps this is overkill, perhaps not. But if your
needs are small, this package should work just fine. This package would also work nicely if you
wanted to perform data dumps for reports. Again, just keep it simple. My interest in this package
stemmed from being behind a firewall which prevented me from installing a native implementation
of the `node_ibmdb` package. Had I had the time, I would have pursued that route but it had become
something of a rabbit hole and I looked for a more generic approach. I will say that this package
should allow for a single means of accessing SQL databases vs. having a bespoke version for each
provider. I hope that anyone who needs something simple can benefit from this package. Were it
not for niuntun's efforts, this package would never be as polished as it is. My hat's off to him.

[npm-image]: https://img.shields.io/npm/v/node-adodb-extended.svg?style=flat-square
[npm-url]: https://www.npmjs.org/package/node-adodb-extended
[download-image]: https://img.shields.io/npm/dm/node-adodb-extended.svg?style=flat-square
[appveyor-image]: https://img.shields.io/appveyor/ci/nuintun/node-adodb-extended/master.svg?style=flat-square&label=windows
[appveyor-url]: https://ci.appveyor.com/project/nuintun/node-adodb-extended
[coveralls-image]: http://img.shields.io/coveralls/nuintun/node-adodb-extended/master.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/nuintun/node-adodb-extended?branch=master
[david-image]: https://img.shields.io/david/nuintun/node-adodb-extended.svg?style=flat-square
[david-url]: https://david-dm.org/nuintun/node-adodb-extended
[node-image]: https://img.shields.io/node/v/node-adodb-extended.svg?style=flat-square
