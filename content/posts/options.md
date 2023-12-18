---
title: "FP & Types: The Option Type"
tags: 
  - Functional Programming
  - Monads
draft: true
date: 2023-12-18
---

As a very gentle introduction to "Sum Types" and monads, I'll introduce the `Option<T>` type.
This type is actually best described by others, so I'll be brief and add some high quality articles
explaining these concepts further at the end of the article.

## Sum Types

There are many ways to model the physical world. OOP generally structures this into classes which
encapsulate data, for example one could have a student and a teacher type, each one inheriting from
a person type:

```typescript
interface Person {
    name: string;
    birthday: Date;
}

```

A pretty pithy example I think you would agree, and I generally don't like these cherry-picked
object model examples, so just take this with a grain of salt and mainly focus on the language
constructs and not the specifics on the types.

One could write this type slightly differently if they knew all the kinds of people they were
modeling, and this technique is modeling the person as a **Sum Type**

```typescript
interface Teacher {
    type: 'teacher';
    name: string;
    subject: string;
}

interface Student {
    type: 'student';
    courses: string[];
    birthday: Date;
}

type Person = Teacher | student;
```

### So what?

In this case we've modeled the `Person` to be _either_ a `Teacher` or a `Student`. No in between,
no guesses. The power here is that now the compiler (or transpiler, or static code analysis tool)
can tell the difference between the two and can operate on them as such. I'll leave exercises to
the reader, and you can do more reading on sum types in typescript on your own.

## Nullability

Before I go further, a brief word: **nullability**. Options stand directly in contrast to `null`
so it's good to know what they are. `nullptr` is the [billion dollar mistake](https://en.wikipedia.org/wiki/Tony_Hoare#Research_and_career)
produced by Tony Hoare to ALGOL, and it's proliferated endlessly from there. Any function returning
a reference type (in strongly typed languages) or any function at all (in weakly typed languages)
suffer from constant null checks.

## What other Option do we have?

The alternative is the `Option` which is defined as follows (first in haskell, then in typescript):

```haskell
data Maybe a = Nothing | Just a
```

```typescript
interface None {
    _tag: 'None'
}

interface Some<T> {
    _tag: 'Some'
    value: T
}

type Maybe<T> = None | Some<T>
```

There's a bit of beauty here to me.
