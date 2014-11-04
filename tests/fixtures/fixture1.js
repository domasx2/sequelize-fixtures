module.exports = [
    {
        "model":"Foo",
        "data": {
            "propA": "tralivali",
            "propB": 2 + 2,
            "status": false
        }
    },
    {
        "model":"Foo",
        "data": {
            "propA": "treerre",
            "propB": 4 / 2,
            "status": false
        }
    },
    {
        "model":"Bar",
        "data": {
            "propA": (new Date()).toString(),
            "propB": 43,
            "status": false
        }
    }
];
