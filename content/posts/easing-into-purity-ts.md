---
title: Easing into Functional Purity in Typescript
draft: true
katex: true
---

## Introduction

Functional programming is everywhere these days. Our cloud services use FP to make parallel guarantees, languages like javascript, c#, and rust
all include very functional language features, and frameworks like Spark and React enforce outright functional design patterns.

At the same time, in my experience, it seems that many engineers don't know very much about it, or know how to leverage FP in their day to day work.
Most of all, though, I find that people can tend to be afraid of FP. My hope is to give the first tastes of it here.

### Who is this for?

This post is for people who may have heard about or is interested in functional programming but may not know that much about it,
or have never tried it themselves.

### What should we expect to learn?

- Why is Functional Programming Important, and why should _I_ care about it?
- What does functional programming really entail?
- What does functional programming look like in typescript?

## Why is Functional Programming Important?

### Software Engineering is Hard

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

### How can FP Help?

There are a lot of things (as mentioned above) which make the "software problem" a difficult one, but they generally all boil down to complexity.
I find that the single biggest complaint I get from folks who are more junior is that they don't understand what's going on in the code, or
more importantly, they're too afraid to change code because they aren't sure what other impacts they're going to have on the global system.

> A change here, a bug over there!

That's the reality a lot of people live in. If they change something in one place a bug could flutter up in some other inexplicable place.
This is a processes we can generally call "coupling". The problem here is that there are many instances where two units of code are not
**directly dependent** on one another, but rather exist somewhere more intermediate along the spectrum of dependent and independent.

This global coupling has far reaching implications... literally! It means a couple of things to me:

1. A productive (and correct) engineer must keep much more of the system in her head
2. Where testing these units of code we must have ***huge*** amounts of code tested and integrated together

Recognizing that global state (or any state external to a function) does the above, why do we use any state whatsoever? Well there are good
reasons. Firstly it is absolutely true that using global state has applications where as an optimization it offers *dramatic* speedups. One
such example would be painting to a framebuffer in graphics programming. Not an exercise I would enjoy revisiting, but *certainly* not something
I would want to use FP for.

> Early Optimization is the root of many evils

Age old computing phrase dusted off again. If you found an engineer using an esoteric optimization on an area of code which didn't need it
you'd be likely to question it. The reality is that in most business applications, we don't need this global state and mutation to get the
job done. We're not counting frames per second, and most of our processing time is spent waiting for api calls and database queries.

## What is Functional Programming?

Functional programming can be described in many ways.

In *Clean Architecture* Robert Martin describes it as the 3rd paradigm in the following procession:

1. Structured Programming: Remove `goto`
2. Object Oriented Programming: Enforce **Encapsulation**
3. Functional Programming: Remove **mutation**

Wikipedia describes it as a paradigm in which "programs are constructed by applying and composing functions."

One could also simply describe code as **functional** in contrast to **imperative**, in that imperative code allows both for mutation
and "impurity" (or gathering data from outside the function context); and functional does not allow either activity.

I'll also point out what I *don't* think that it is:

- it is *not* category theory
- it is *not* necessarily typed
- it does *not* need to be in a "functional language"
- it need not be extremely difficult mathematics

Finally I'll state the minimum for what it takes to be a functional language (in this engineer's opinion):

- Functional Programing requires the ability to pass and return functions as data

Yep, I tried to think of anything else one would need, but honestly for just about everything else in FP you can roll it yourself as long
as you can pass functions as **first class data citizens**. I went ahead and asked ChatGPT about modern languages breaking this and the 4
it gave were SQL, VBA, COBOL, and Fortran. So odds are exceedingly good you could go FP on your next ticket.

## How can I do it in typescript?

Let's build this up slowly. We want to look at a couple of procedural bits of code, and then look at their more functional counter
parts.

In these examples I'm going to use terms like "issues" and "problems". From this point forward, we should assume that the discussion is already
"assuming the sale" in terms of FP.

### The accumulator

There is a pattern I see pop up pretty often, and it looks like this:

```typescript
interface DataPoint {
  value: number;
  type: string;
}

function accumulateTheData(data: DataPoint[]): number {
  var result: number = 0;
  for (var i = 0; i < data.length; i++) {
    if (data[i].type === 'TheRightType')
      result += data[i].value;
  }
  return result;
}
```

So there are two basic problems:

- We mutate the result to accumulate on to
- That pesky `i` is also mutated

> Well this doesn't seem so bad, right? Why should this be an issue?

The answer to that question generally happens at scale. I see these for loops everywhere where we accumulate onto a scalar value,
or a list, and the problem is that we're normally solving *very* complicated problems in these loops, which mean that even if
they aren't global state, the state is still a "loop carried dependency" where you're having to think about previous values.

Now let's look at the FP:

```typescript
const accumulateTheData = (data: DataPoint[]): number =>
  data
    .filter(d => d.type === 'TheRightType')
    .map(d => d.value)
    .reduce((acc,a) => acc + a);
```

> Oh so we're filtering, then mapping, then reducing!

No mutation, everything is pure, and it extracts from the logic a very clear set of steps one can understand.

As a quick sidenote, I find a gigantic amount of business logic is reduced down to a set of filters, maps, and reducers.

### Undefined and Null

We've all heard it, null reference is the billion dollar bug. Let's see how it normally looks

```typescript
interface Contract {
  status: string;
  contractId: string;
  // ...
}

function findActiveContract(contracts: Contract[]): Contract {
  // find returns the first object matching the predicate, otherwise returns undefined
  return contracts.find(c => c.status === 'Active');
}

function main() {
    const contracts: Contract[] = [];

    const active = findActiveContract(contracts);

    console.log(active.contractId);
    // cannot read propertay ... of undefined
}
```

Classic! In javascript we see the above, in C# we see `NullReferenceException`, the list goes on! See there are instances
where we might want to return Something, but sometimes we want to return Nothing. The way we would sort out the above
is an increasingly complex series of `if` statements which determine whether or not we are `null`:

```typescript
interface Contract {
  status: string;
  contractId: string;
  // ...
}

function FindActiveContract(contracts: Contract[]): Contract;

const GetContractId = (contract: Contract): string => contract.contractId;

const main = () => {
  const contracts: Contract[];
  const activeContract: Contract = FindActiveContract(contracts);
  // ¯\_(ツ)_/¯
  if (activeContract !== undefined)
    const contractId: string = GetContractId(activeContract);
    // continue execution, but every time you want to use contractId, we have
    // some checking to do, or we need to nest if statements further
}
```

So let's see how we might do this functionally:
