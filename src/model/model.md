# Model

## Setup

Model is exported as `FinanceModel` for later intstantiation by the controller, the constructor initalizaes `this.transactions` with an empty array to prevent undefined or null returns, this will later be used as our local copy of the transactions for faster viewing/manipulating

## init()

is set as an async function so we can use `await` for `getAllTransactions` 

in the `try` we await all transactions from storage service and initalize  `this.transactions` with it, the conditional operator is an extra saftey net incase storage service returns anything except an array

in the `catch` we send out the error as well as overwrite transaction with an empty array

## getAll

returns a __Shallow copy__ of the array, this is to prevent data mutation by copying the array over to a new array so mutation does affect source of truth



