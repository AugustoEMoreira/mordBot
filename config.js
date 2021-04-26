const fs = require('fs')

let file = fs.readFileSync('./config.json')
let json = JSON.parse(file.toString())

module.exports = json


console.log(json)