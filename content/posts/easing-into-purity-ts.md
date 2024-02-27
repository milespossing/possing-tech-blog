---
title: Easing into Functional Purity in Typescript
draft: true
katex: true
---

## Introduction

Functional programming is everywhere these days. Our cloud services use FP to make parallel guarantees, languages like javascript, c#, and rust
all include very functional language features, and frameworks like Spark and React enforce outright functional design patterns.

At the same time, in my experience, it seems that many engineers don't know very much about it, or know how to leverage FP in their day to day work.

### Who is this for?

This post is for people who may have heard about or is interested in functional programming but may not know that much about it,
or have never tried it themselves.

### What should we expect to learn?

- Why is Functional Programming Important, and why should _I_ care about it?
- What does functional programming really entail?
- What does functional programming look like in typescript?

## Why is Functional Programming Important?

Software Engineering is a very wide practice. Even before we introduced "DevOps Culture" we needed to understand the idiosyncracies of computers,
how software scales and design patterns to ensure it continues to be maintainable, and we need to find ways to articulate business needs within
that framework. We maintain correctness, complexity, performance, and maintainability; and we need to do so quickly as business requirements
intermix and change, and do so on or near code often written 5-10 years ago by people who are no longer around, for inscrutable reasons.

> The top line header here is that **Software is necessarily complex**.

If you'll forgive the simplification, "Software Quality" could conscisely be put in 3 buckets:

- Correctness: *Does the software do what we **think** it will do, and is it bug free*?
- Code Quality: *Is the software readable, maintainable, reusable, and testable*?
- Performance: *Does the software do what we want it to do and quickly*?

> Anything we can do to better answer these questions in our day to day is an important thing to do.

## What is Functional Programming?

### Notes on Paradigms

### Some definitions and contrasts

Functional programming can be described in many ways.

In *Clean Architecture* Robert Martin describes it as the 3rd paradigm in the following:

1. Structured Programming: Remove `goto`
2. Object Oriented Programming: Enforce **Encapsulation**
3. Functional Programming: Remove **mutation**

Wikipedia describes it as a paradigm in which "programs are constructed by applying and composing functions."

One could also simply describe code as **functional** in contrast to **imperative**, in that imperative code allows for mutation, and functional
does not.

I'll also point out what I *don't* think that it is:

- it is *not* category theory
- it is *not* necessarily typed
- it does *not* need to be in a "functional language"

Finally I'll state the minimum for what it takes to be a functional language (in this engineer's opinion):

- Functional Programing requires the ability to pass functions as arguments
- Functional Programing requires the ability to return functions from functions

Yep, I tried to think of anything else one would need, but honestly for just about everything else in FP you can roll it yourself as long
as you can pass functions as **first class data**.

## How can I do it in typescript?

## On the growth of Paradigms

- Historically we've always added structure to engineering practice, freedom through restriction
- Operate at the HIGHEST level of restriction while still being able to perform the basic job

## The functional paradigm

- Use of pure functions
- Data mutation is forbidden

## 4 examples of common, impure code:

- code with a read reference to global state, RNG, DateTime
- code with a write reference to global state
- code which throws an exception
- code which returns a Promise<T> instance

```typescript
let state = 0;
const example1 = (): number => {
    // Random numbers are IO
    const rnd = Random.next();
    // A read from global mutable state is IO
    return rnd * state;
}

const example2 = (input: number) => {
    // Mutating state is IO
    state = input * 2;
}

const divide = (a: number, b: number): number => {
    // Throwing (in javascript) is not referentially transparent
    if (b === 0) throw new Error('Cannot divide by zero!');
    return a / b;
}

const complicated = async (id: string): Promise<Invoice> => {
    // get the invoice - db read is IO
    const result = await db.collection('invoices').find({ id });
    // get its statement - db read is IO
    const statement = awaid db.collection('statements').find({ id: result.statementId });
    // update the invoice with data from the statement
    result.someField = statement.someOtherField;
    return result;
}
```

## 3 Classes

- Data
- Computations
- Actions

Data does nothing, it is pure and descriptive.

Computations have no side-effects and are pure and referentially transparent.

Actions have impact on the world. They have side-effects.

## Functional Impurity: the dangers hand hassles

So I complain a lot about impurity. But as far as you're concerned, planes are still
flying, cars are still driving, and you might still be coding imperatively, so why
make any kind of switch? Here are some potential arguments for a few different personas

### For the "Lazy" engineer

Do you like keeping class hierarchies in your head at all times? Do you enjoy thinking
on 5 or 6 levels of abstraction at a time? Statefulness, while it has its place in
the mosaic of optimizations, necessarily gives any system a quality of "interdependence".

OOP seeks to encapsulate this interdependence via interface, while FP attempts to remove
this interdependence via immutability. Now which one is right? Fortunately they both are.

A good article on this may be found [here](http://www.sevangelatos.com/john-carmack-on/)
and it was written by John Carmack (the Doom guy). He wrote a couple of important
observations here:

> "A large fraction of the flaws in software development are due to
programmers not fully understanding all the possible states their code may execute in."

And here:

>No matter what language you work in, programming in a functional style provides benefits.
You should do it whenever it is convenient, and you should think hard about the decision
when it isn’t convenient

I understand the need for mutation. Many algorithms are best optimized with heap memory,
many situations are best served by an engineer's ability to grind memory access down to
a razor's edge in some interesting ways. But for every one of those truly fantastic
optimizations, there are probably 10 bugs generated by the same pattern (no backing numbers
on that. Merely anecdotal professional experience).

### For the "Test Driven" engineer

State makes tests hard. How many states can your function run in? How can you quantify
the domain over which the function runs? If a function has a huge amount of externality
in it, that leaves you altering large amounts of state in your tests and makes it nearly
impossible for static analysis to monitor code and correctness.

### For the Engineering Manager

State makes a system difficult to grok. If you ask any young engineer here to review a
stateful function, it's 

### For the Business Manager

### Why can state be bad?

For starters, state is _potentially_ dangerous. The developer of a function may have a good
understanding of how the state will change over time, but they will not always be there.
Adding some external state to your function or object means that if it does need to operate
on some external data, you need to have broad _system-wide_ understanding of the agents which
mutate the state, and in order to mutate the state, you need to have broad system-wide understanding
. This, of course means that any users of the function also need to have
such an understanding.

### Statefulness and Testing

Statefulness introduces a new vector to test over. Take this function:

```typescript
let state = 0;
const example1 = (): number => {
    const rnd = Random.next();
    return rnd * state;
}
```

In order to test the above, you would need to gather together whatever agents mutate
the above code and make sure that they do in fact make the required change to `state`.

More haneously, let's look at this one (a common mainstay in the royalties system):

```typescript
const complicated = async (id: string): Promise<Invoice> => {
    // get the invoice
    const result = await db.collection('invoices').find({ id });
    // get its statement
    const statement = awaid db.collection('statements').find({ id: result.statementId });
    // don't do anything if it's a test statement
    if (statement.type === 'TEST')
        return undefined;
    // update the invoice with data from the statement
    result.someField = statement.someOtherField;
    return result;
}
```

Here the state of `db` (our database client) itself is actually stateful. Let alone
the external state fo the database for a moment (a necessary impurity) we find ourselves
quite unable to test this logic without first bringing along the entire state of the
application (in whether the db has been connected) as well as the state of the database.

So in order to test the above, even for a simple unit test to test requires a huge amount
of manipulation of the app just to be able to test the basics of the business logic.

### System-Wide Knowledge

I actually have quite a good working memory. I can keep a fair amount of things in my
head at the same time, and I'd rank my memory and ability to keep very large amounts
of system architecture in my head as above average.

Even I fail to encasulate entire systems.

I will never be in a place where I can hold the entire system in my head, and I'm not
trying to get there anyway.

The fact is, the more we can reduce the amount of system knowledge you need at a given
moment (ie, the clearer you keep your RAM), the more focus you can put towards the task
at hand.

[[[[[[[Might want a better example here]]]]]]]
Take an example, you want to make a sandwich for some children. If we're making a sandwich
for our own children, with our own ingredients, in our own kitchen, we know about all the
externalities, so it doesn't matter much
[[[[[[[[[[[[[[[[[[[]]]]]]]]]]]]]]]]]]]

In functional programming, you can make as many demands on the state of your function
and its context of execution as you'd like. The stronger the better. For example, why
not just the following:

```typescript

// I'm using some funny code here as an example, fp-ts has all
// the monads you need
type Option<T> = None | Some<T>(t: T)

// note on types, I use a record here to be lazy, you can do
// whatever you'd like here
const simple = (invoice, statement): Option<Record<string, any>> {
    if (statement.type === 'TEST')
        return None;
    return Some({ ...invoice, someField: statement.someOtherField });
}

// "Do" notation for the composition of the invoice and statement left to the reader
```

Now some of you might complain that I've cheated here, why am I allowed to just take
out the parts of the app which, by my own admission, _do_ actually need to be there.

Well for starters this is my blog post, so I cak skip some stuff. More realistically
I'd argue that the real healthy thing for that function would be to separate out the
two concerns. You have the IO concerns which could be described as a function returning
some variety of `IO<(Invoice, Statement)>` (most likely a `TaskEither<Error, [Statement, Invoice]>`
in `fp-ts`), and a function which would be used in a fancy something called a **functor**
(which can be seen later in this post).


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
