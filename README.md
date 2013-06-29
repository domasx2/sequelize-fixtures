Sequelize fixtures
==========================================

This is a simple lib to load data to database using sequelize.  
It is intended for easily setting up test data.  
Yaml and json formats are supported. Includes a grunt task.  

findOrCreate is used to create records, so no record duplication when identical fixtures are defined or loaded multiple times.

# Install
    
    npm install sequelize-fixtures

# Test
    
    npm test

# Usage

```javascript
    var sequelize_fixtures = require('sequelize-fixtures'),
        models = {
            Foo: require('./models/Foo')
        };

    //from file
    sequelize_fixtures.load('fixtures/test_data.json', models, function(err){
        doStuffAfterLoad();
    });

    //can use glob syntax to load multiple files
    sequelize_fixtures.load('fixtures/*.json', models, function(err){
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
    sequelize_fixtures.load(fixtures, models, function(err){
        doStuffAfterLoad();
    });
```

# File formats

## json

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

## yaml

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
                files: 'fixtures/data*.json', //glob path
                models: '../models' //string will be require()'d when task is run
            },
            test_data3: {
                files: 'fixtures/*',
                models: function () {  //function will be evaluated for models object
                    return require('./models');
                }
            }
        }

    });

    grunt.loadNpmTasks('sequelize-fixtures');
```
# TODO

Dump data into fixtures  
Natural keys for associations  