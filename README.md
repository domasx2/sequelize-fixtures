[![Build Status](https://travis-ci.org/domasx2/sequelize-fixtures.svg?branch=master)](https://travis-ci.org/domasx2/sequelize-fixtures)

Sequelize fixtures
==========================================

This is a simple lib to load data to database using sequelize.  
It is intended for easily setting up test data.  
Yaml and json formats are supported. Includes a grunt task.  
Duplicate records are not inserted.
API returns bluebird promises, but callbacks can also be used as the last argument.  

Tested with latest Sequelize (5.0)

### Install

    npm install sequelize-fixtures

### Test

    npm test

### Usage

```javascript
    const sequelize_fixtures = require('sequelize-fixtures');

    //a map of [model name] : model
    //see offical example on how to load models
    //https://github.com/sequelize/express-example/blob/master/models/index.js
    const models = require('./models');

    //from file
    sequelize_fixtures.loadFile('fixtures/test_data.json', models).then(function(){
        doStuffAfterLoad();
    });

    //can use glob syntax to select multiple files
    sequelize_fixtures.loadFile('fixtures/*.json', models).then(function(){
        doStuffAfterLoad();
    });

    //array of files
    sequelize_fixtures.loadFiles(['fixtures/users.json', 'fixtures/data*.json'], models).then(function(){
        doStuffAfterLoad();
    });

    //specify file encoding (default utf8)
    sequelize_fixtures.loadFile('fixtures/*.json', models, { encoding: 'windows-1257'}).then(function(){
        doStuffAfterLoad();
    });

    //specify logging function (default console.log)
    function myLogging(defaultLog) {
        console.log('Fixtures: processing ...')
    }
    sequelize_fixtures.loadFile('fixtures/*.json', models, { log: myLogging}).then(function(){
        doStuffAfterLoad();
    });

    //specify separate stdout and stderr streams
    //(e.g. a winston-compatible logger)
    function errorReporter(message) {
      console.error('OH NO! ERROR: ' + message);
    }
    sequelize_fixtures.loadFile('fixtures/*.json', models, {
      logger: {
        debug: console.log,
        info: console.log,
        warn: console.log,
        error: errorReporter
      }
    }).then(function(){
        doStuffAfterLoad();
    });

    //load fixtures inside a transaction
    sequelize.transaction(function(tx) {
        sequelize_fixtures.loadFile('fixtures/*.json', models, { transaction: tx}).then(doStuffAfterLoad);
    });

    //apply transform for each model being loaded
    sequelize_fixtures.loadFile('fixtures/*.json', models, {
        transformFixtureDataFn: function (data) {
          if(data.createdAt
           && data.createdAt < 0) {
            data.createdAt = new Date((new Date()).getTime() + parseFloat(data.createdAt) * 1000 * 60);
          }
          return data;
        }
    }).then(function() {
        doStuffAfterLoad();
    });

    //modify each model being loaded
    sequelize_fixtures.loadFile('fixtures/*.json', models, {
        modifyFixtureDataFn: function (data) {
          if(!data.createdAt) {
            data.createdAt = new Date();
          }
          return data;
        }
    }).then(function() {
        doStuffAfterLoad();
    });

    //from array
    var fixtures = [
        {
            model: 'Foo',
            data: {
                propA: 'bar',
                propB: 1
            }
        },
        {
            model: 'Foo',
            data: {
                propA: 'baz',
                propB: 3
            }
        }
    ];
    sequelize_fixtures.loadFixtures(fixtures, models).then(function(){
        doStuffAfterLoad();
    });
```

### File formats

#### json

```json
    [
        {
            "model": "Foo",
            "data": {
                "propA": "bar",
                "propB": 1
            }
        },
        {
            "model": "Foo",
            "data": {
                "propA": "baz",
                "propB": 3
            }
        }
    ]
```

#### yaml

```yaml
    fixtures:
        - model: Foo
          data:
            propA: bar
            propB: 1
        - model: Foo
          data:
            propA: baz
            propB: 3
```


#### javascript

```javascript
    module.exports = [
        {
            "model": "Foo",
            "data": {
                "propA": "bar",
                "propB": 1
            }
        },
        {
            "model": "Foo",
            "data": {
                "propA": "baz",
                "propB": 3
            }
        }
    ];
```


### Associations

You can specify associations by providing related object id or a where clause to select associated object with. Make sure associated objects are described before associations!

#### One to many

Assuming
```javascript
Car.belongsTo(Owner);
Owner.hasMany(Car);
```
Associated entity can be mapped by providing either an id:  

```json
[
    {
        "model": "Owner",
        "data": {
            "id": 11,
            "name": "John Doe",
            "city": "Vilnius"
        }
    },
    {
        "model": "Car",
        "data": {
            "id": 203,
            "make": "Ford",
            "owner": 11
        }
    }
]
```

Or a property-value map (like a 'where' object) to find the entity with:  

```json
[
    {
        "model": "Owner",
        "data": {
            "name": "John Doe",
            "city": "Vilnius"
        }
    },
    {
        "model": "Car",
        "data": {
            "make": "Ford",
            "owner": {
                "name": "John Doe"
            }
        }
    }
]
```

#### Many to many

Assuming

```javascript
Project.belongsToMany(Person, {through: 'peopleprojects'});
Person.belongsToMany(Project, {through: 'peopleprojects'});
```

Associated entities can be mapped using the association 'as' name ('people' for Project and 'projects' for People) or 'through' table name, and providing an array of ids:

```json
[
    {
        "model":"Person",
        "data":{
            "id":122,
            "name": "Jack",
            "role": "Developer"
        }
    },
    {
        "model":"Person",
        "data":{
            "id": 123,
            "name": "John",
            "role": "Analyst"
        }
    },
    {
        "model":"Project",
        "data": {
            "id": 20,
            "name": "The Great Project",
            "people": [122, 123]
        }
    }

]
```

Or an array of property-value mappings to find the entities with:


```json
[
    {
        "model":"Person",
        "data":{
            "name": "Jack",
            "role": "Developer"
        }
    },
    {
        "model":"Person",
        "data":{
            "name": "John",
            "role": "Analyst"
        }
    },
    {
        "model":"Project",
        "data": {
            "name": "The Great Project",
            "people": [
                {                        
                    "name": "Jack"
                },
                {
                    "name": "John"
                }
            ]
        }
    }

]
```

If you have a custom through model for a m2m relationship, you can set additional attributes using `_through`:

```javascript
ActorsMovies = sequelize.define("ActorsMovies", {
    character: {type: DataTypes.STRING}
});
Movie.belongsToMany(Actor, {through: ActorsMovies});
Actor.belongsToMany(Movie, {through: ActorsMovies});
```

```json
[
    {
        "model": "Movie",
        "data": {
            "name": "Terminator"      
        }
    },
    {
        "model": "Actor",
        "data": {
            "name": "Arnie",
            "movies": [
                {
                    "name": "Terminator",
                    "_through": {
                        "character": "T-80"
                    }
                }
            ]
        }
    }
]
```

#### Build options, save options

For each model you can provide build options that are passed to Model.build() and save options that are passed to instance.save(), example:

```json
{
    "model": "Article",
    "buildOptions": {
        "raw": true,
        "isNewRecord": true
    },
    "saveOptions": {
        "fields": ["title", "body"]
    },
    "data": {
        "title": "Any title",
        "slug": "My Invalid Slug"
    }
}

```

#### Detect duplicates based on select fields

In case you want to detect duplicates based on specific field or fields rather than all fields (for example, don't include entities with the same id, even if other fields don't match), you can specify these fields with a 'keys' property.

```json
{
    "model": "Person",
    "keys": ["email"],
    "data": {
        "name": "John",
        "email": "example@example.com"
    }
},
{
    "model": "Person",
    "keys": ["email"],
    "data": {
        "name": "Patrick",
        "email": "example@example.com"
    }
}

```
In this example only John will be loaded



#### Ignore setters (`ignoreSet`)

By default, this library attempts to run values through any defined property setters to coerce the value correctly.
If you use instance methods (other than `setDataValue`, which a mock is created for), then this will raise an error.

For example:

```javascript
const User = sequelize.define('User',
  email: {
    type: DataTypes.STRING,
    unique: true,
    validate: {
      isEmail: true,
    },
    set: function set(val) {
      if (this.previous('email')) { // <--- this line will raise an error
        // check some thing
      }
      this.setDataValue('email', val);
    }
  }
});
```

 You can turn off this behavior by setting `ignoreSet` to true.

 ```json
 {
     "model": "User",
     "ignoreSet": true,
     "saveOptions": {
         "fields": ["title", "body"]
     },
     "data": {
         "title": "Any title",
         "slug": "My Invalid Slug"
     }
 }
 ```

 This ignores any defined setters for this model and instead just set the value
 as the same data literal specified in the fixture.


# grunt task

Gruntfile.js:

```javascript
    grunt.initConfig({
        fixtures: {
            import_test_data: {
                src: ['fixtures/data1.json', 'fixtures/models*.json'],
                // supports async loading models
                models: async function () {  
                    return await loadModels();
                },
                options: {
                    //specify encoding, optional default utf-8
                    encoding: 'windows-1257'
                }
            }
        }

    });

    grunt.loadNpmTasks('sequelize-fixtures');
```
