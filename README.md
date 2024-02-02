# MonadPrimus2

MonadPrimus2 is a library which mulplate monads.  

## How To Use

```html
<script src="mc.js"></script>
```

## Supported Monads

* Identity monad
* Maybe monad and its transformer
* Either monad
* ExceptT monad and its transformer
* List monad
* State monad and its transformer
* Reader monad and its transformer
* Writer monad and its transformer
* Continuation monad

## Example

```javascript
const M = MonadPrimus2();

// Example 1: Maybe monad
const C1 = M.Maybe(null);
console.log(
    C1.from(7)                         // from clause is a "library sugar" to write like Haskell do notation
    .from(6)
    .from(5)
    .select((x, y, z) => x + y + z));  // output: 18
console.log(
    C1.from(7)
    .from(null)
    .from(5)
    .select((x, y, z) => x + y + z));  // output: null

// Example 2: Either monad
const C2 = M.Either;
console.log(
    C2.from(7)
    .from(6)
    .from(5)
    .select((x, y, z) => x + y + z));  // output: 18
console.log(
    C2.from(7)
    .from(M.Either.left("not a number"))
    .from(5)
    .select((x, y, z) => x + y + z));  // output: Left("not a number")

// Example 3: List monad 1
const toArray = M.List.foldr((accum, v) => accum.concat([v]))([]);
const g3 =
    M.List.from(M.R(1, 2))
    .from(M.R(1, 2))
    .from(M.R(1, 2))
    .select((x, y, z) => x + y + z);
console.log(toArray(M.List.head(2)(g3)));  // output: [3, 4]

const g3_1 = M.List.bind(M.R(1),
    z => M.List.bind(M.R(1, z),
    x => M.List.bind(M.R(x, z),
    y => M.List.bind(x * x + y * y === z * z ? M.List.unit(null) : M.List.empty,
    _ => M.List.unit([x, y, z])))));
console.log(toArray(M.List.head(2)(g3_1)));  // output: [[3, 4, 5], [6, 8, 10]]

const g3_2 =
    M.List.from(M.R(1))
    .where(v => v % 2 === 0)
    .select(v => v * 2);
console.log(toArray(M.List.head(2)(g3_2)));  // output: [4, 8]
```

