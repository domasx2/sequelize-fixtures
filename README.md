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


### Associations 

You can specify associations by providing related object id or a where clause to select associated object with. Make sure associated objects are described before associations!

#### belongsTo

Assuming `Car.belongsTo(Owner)`:


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

OR 

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
            "owner": { //make sure it's unique across all owners
                "name": "John Doe" 
            }
        }
    }
]
```

#### hasMany

Assuming 

```javascript
Project.hasMany(m.Person);
Person.hasMany(m.Project);
```

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
            "peopleprojects": [122, 123]
        }
    }

]
```

OR


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
            "peopleprojects": [
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



# grunt task

Gruntfile.js:

```javascript
    grunt.initConfig({
        fixtures: {
            import_test_data: {
                src: ['fixtures/data1.json', 'fixtures/models*.json'],
                models: function () {  //returns mapping model name: model
                    return require('../models') 
                },
                options: { //specify encoding, optiona. default utf-8
                    encoding: 'windows-1257'
                }
            }
        }

    });

    grunt.loadNpmTasks('sequelize-fixtures');
```