#### Typescript

Using fp-ts, life becomes nice

```typescript

```

#### Purescript

Haskell for people who need to write js

```purescript
module Main where

import Prelude
import Data.Tuple
import Data.Array

import Effect (Effect)
import Effect.Console (log)

collatz :: Int -> Int
collatz n = aux 1 n
  where
  aux :: Int -> Int -> Int
  aux acc 1 = acc
  aux acc n | n `mod` 2 == 0 = aux (acc + 1) (n / 2)
  aux acc n = aux (acc + 1) (3 * n + 1)

withCollatz :: Int -> Tuple Int Int
withCollatz n = Tuple n (collatz n)

allCollatz = map withCollatz (range 2 1000000)

max :: Tuple Int Int -> Tuple Int Int -> Tuple Int Int
max a b = if (snd a < snd b) then b else a

maxValue = foldl max (Tuple 0 0) allCollatz

main :: Effect Unit
main = do
  log (show (fst maxValue))
```

#### Racket

I LOVE LISPS

```racket
(define (is-even? n) (= 0 (modulo n 2)))
(define (collatz n)
  (define (aux acc a) (cond
                        [(eq? 1 a) acc]
                        [(is-even? a) (aux (+ 1 acc) (/ a 2))]
                        [else (aux (+ 1 acc) (+ 1 (* 3 a)))]))
  (aux 1 n))
(define (with-collatz n) (list n (collatz n)))
(define (map-collatz r) (map with-collatz r))
(define values (range 2 1000000))
(define mapped (map-collatz values))
(define max (foldl (lambda (a b) (if (< (second a) (second b)) b a)) '(0 0) mapped))
(first max)
```
