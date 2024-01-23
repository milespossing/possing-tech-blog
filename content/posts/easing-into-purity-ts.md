---
title: Easing into Functional Purity in Typescript
draft: true
katex: true
---

# OUTLINE

## 4 examples of common, impure code:

- code with a read reference to global state, RNG, DateTime
- code with a write reference to global state
- code which throws an exception
- code which returns a Promise<T> instance

## Functional Impurity: the dangers hand hassles

- Dangers of state
- Unit testing difficulties with state
- Requires system-wide knowledge to code on any part of the system

## Enter functional Purity

- What are pure functions?
- Why are they important? What do they get you?

## Final Code Examples

- Currying
- Either
- TaskEither
- Monadic mapping `::map A<T> -> A<U>`

## My Background

Over the past year I've been exploring the joys of functional programming in typescript.
My FP journey didn't start in this language. I'd say that it started with my battles
with null values in dotnet back at Milliman. That at least was my first real experience
with generics in that particular way. For this I first created my own set of `Maybe<T>`
monads. I would later learn about the
[language-ext library](https://github.com/louthy/language-ext) which would handle this
for me.

Then at Microsoft, while redesigning the architecture of the calculation engine, I had
the opportunity to work with function piping where I would linearly apply some set of
functions, each to the result of the last. This ended up being the keystone for the
architecture I'd implemented. For this I used [Rambda](https://ramdajs.com/), likely
my favorite typeless FP framework in the javascript ecosystem at the time of writing.

Not long after, my formal education would begin. I took Programming Languages and Compilers,
an FP course in disguise in graduate school, and that sealed me in. Monads, bindings,
higher kinded types, and more would begin to swirle around my brain. Haskell was
obviously the centerpiece of this course, but I also got to learn about lisps and
other "non-mainstream" languages.

And finally, while moving our Royalties projects from Javascript to Typescript, I noticed
a pretty key issue with the Rambda library: the type system is not terribly fun to use
(at least I had trouble with it, YMMV). So enters what I would say is the holy grail of
FP and category theory in Typescript: [fp-ts](https://gcanti.github.io/fp-ts/) and her
ecosystem.

I tell this very winding story to underline the fact that, just like anything else,
learning FP is a journey. You get better and refine over time, and just like I learned
a bunch of hugely important OOP patterns at Milliman, and grew as an engineer, I've
had to take time to grow and stretch and experiment as a programmer in my FP practice.

## So what is Functional Purity?

We'll start with potentially the most basic definition: **Functional Purity** as it
relates to FP. A pure function is any function which:

- Returns the same value for a set of inputs every time
- Has no side-effects
- (just for completeness, I'll include) Referential Transparency

Now these seem like pretty basic ideas, how does this actually defferentiate a function
in the real world? Here are some examples of functions which (to some people's suprise)
break the above rules of purity:

| Operaton | Reason |
| :--------|:-------|
| Read from a database | Depending on the state of the database,the function will return different results |
| Returning data from some mutable global state | Should that global state change, the function will return different results |
| Write to a database | This creates a side-effect |
| Random number generation | Anything involving a random number generator represents an IO |

There is an important term here which condenses the entire ideal to a specific construct:
the IO. An IO (or Input/Output) can represent *all* of a function's impurity. So our
rules above are that our function is pure *if it doesn't have any IO*.

### Referential Transparency

A quick definition of referential transparency here. In linguistics, an expression \\(E\\) which
is *referentially transparent* can be replaced with its subexpressions \\(e_i\\). This means
that if you have a function, it is referentially transparent if you can replace that function's
call with its result. There are many implications here, among them are:

- Throwing is not referentially transparent
- A `Promise<T>` *is* referentially transparent (more on this later)

## Why is Functional Purity important?

Functional purity is important for a few reasons, but to me, the most important is
**correctness**. That is to beg the question *how do I know that this program that
I'm writing will do what I expect it to do?* In practice (particularly in enterprise
software engineering), I find that the question *how do I know that this **function**
will do what I expect it to do?* is also an important question.

**Correctness** is at the heart of all engineering practices. It's the very physics
of our profession. Being able to know that a function is *pure* gives engineers the
knowledge that they can use the function safely and with less burden of understanding
the internals of the function. (note my use of the word *less*)

## What does it look like?

Well, let's look at just a couple of examples of some imperative programming.

```typescript
let callCount = 0;
// Imperative
const doSomething = (): number => {

}

// Functional
const sum = (numbers: number[]): number => {
    return numbers.reduce((acc, a) => acc + a);
}
```
