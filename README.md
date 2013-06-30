Sequelize fixtures
==========================================

This is a simple lib to load data to database using sequelize.  
It is intended for easily setting up test data.  
Yaml and json formats are supported. Includes a grunt task.  

findOrCreate is used to create records, so no record duplication when identical fixtures are defined or loaded multiple times.

### Install
    
    npm install sequelize-fixtures

### Test
    
    npm test

### Usage

```javascript
    var sequelize_fixtures = require('sequelize-fixtures'),
        models = {
            Foo: require('./models/Foo')
        };

    //from file
    sequelize_fixtures.loadFile('fixtures/test_data.json', models, function(){
        doStuffAfterLoad();
    });

    //can use glob syntax to select multiple files
    sequelize_fixtures.loadFile('fixtures/*.json', models, function(){
        doStuffAfterLoad();
    });

    //array of files
    sequelize_fixtures.loadFiles(['fixtures/users.json', 'fixtures/data*.json'], models, function(){
        doStuffAfterLoad();
    };

    //specify file encoding (default utf8)
    sequelize_fixtures.loadFile('fixtures/*.json', models, { encoding: 'windows-1257'}, function(){
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
    ]
    sequelize_fixtures.loadFixtures(fixtures, models, function(err){
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

### Natural Keys  

To not have to specify id  field when describing associated records, you can use 'natural keys'. Or in the context of sequelize, essentially a 'where' clause to be used to retrieve the association via AssociatedModel.find :)  
Only BelongsTo is supported for the moment.

Assuming `Bar.belongsTo(Foo)`:
```json
[
    {
        model: 'Foo',
        data: {
            uniqueProp: 'FOO1',
            uniqueProp2: 1,
            propA: 'baz'
        }
    },
    {
        model: 'Bar',
        data: {
            propA: 'something',
            foos: {
                uniqueProp: 'FOO1', 
                uniqueProp2: 1
            }
        }
    }
]
```

# grunt task

Gruntfile.js:

```javascript
    grunt.initConfig({
        fixtures: {
            test_data: {
                files: ['fixtures/data1.json', 'fixtures/data2.json'], //list of files
                models: require('../models')  //object Model name: model
            },
            test_data2: {
                file: 'fixtures/data*.json', //one file
                models: '../models' //string will be require()'d when task is run
            },
            test_data3: {
                file: 'fixtures/*',
                models: function () {  //function will be evaluated for models object
                    return require('./models');
                },
                options: { //specify encoding
                    encoding: 'windows-1257'
                }
            }
        }

    });

    grunt.loadNpmTasks('sequelize-fixtures');
```
# TODO

Utility for dumpiong data into fixtures