let ipkg = require('../ipkg/ipkg')
let commands = require('../idris/commands')
let controller = require('../controller')
let vscode = require('vscode')

let identRegex = /'?[a-zA-Z0-9_][a-zA-Z0-9_-]*'?/g
var identMatch
var identList

let buildCompletionList = () => {
  identList = []

  let text = vscode.window.activeTextEditor.document.getText()
  while (identMatch = identRegex.exec(text)) {
    let ident = identMatch[0]
    if (identList.indexOf(ident) <= -1) {
      identList.push(ident)
    }
  }
}

let IdrisCompletionProvider = (function () {
  function IdrisCompletionProvider() { }

  IdrisCompletionProvider.prototype.provideCompletionItems = (document, position, token) => {
    var wordRange = document.getWordRangeAtPosition(position)
    var currentWord = document.getText(wordRange)

    let trimmedPrefix = currentWord.trim()

    if (trimmedPrefix.length >= 2) {
      let suggestMode = vscode.workspace.getConfiguration('idris').get('suggestMode')

      if (suggestMode == 'allWords') {
        identList.filter((ident) => {
          ident.startsWith(trimmedPrefix)
        })

        return identList.map((ident) => {
          return new vscode.CompletionItem(ident, 0)
        })
      } else if (suggestMode == 'replCompletion') {
        return controller.getCompilerOptsPromise().flatMap((compilerOptions) => {
          commands.initialize(compilerOptions)
          return commands.getModel().load(document.uri.fsPath).filter((arg) => {
            return arg.responseType === 'return'
          }).flatMap(() => {
            return commands.getModel().replCompletions(trimmedPrefix)
          })
        }).toPromise().then((arg) => {
          let ref = arg.msg[0][0]
          let results = ref.map((v, i, arr) => {
            return new vscode.CompletionItem(v, 1)
          })
          return results
        })
      } else {
        vscode.window.showErrorMessage("Invalid option for idris.suggestMode")
        return null
      }
    } else {
      return null
    }
  }
  return IdrisCompletionProvider
}())

module.exports = {
  IdrisCompletionProvider,
  buildCompletionList
}
