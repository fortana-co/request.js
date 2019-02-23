module.exports = {
  "parser": "babel-eslint",
  "rules": {
    "indent": [2, 2],
    "quotes": [2, "single"],
    "linebreak-style": [2, "unix"],
    "semi": [2, "never"],
    "no-unused-vars": 2,
  },
  "env": {
    "es6": true,
    "node": true,
    "browser": true,
  },
  "extends": "eslint:recommended",
}