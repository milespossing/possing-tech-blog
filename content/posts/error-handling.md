---
title: "Error Handling Paradigms"
tags: 
  - Code Patterns
draft: true
date: 2024-01-01
---

## Introduction

Error handling is a huge beast, and I'm only going to cover a subset of the overall ideas in it
here. This will serve as a reasonable explanation of how I see error handling, and the majority
of useful cases one will handle or implement. I want to be clear up top, though; this is just
one way to think about something incredibly abstract, and if something here _doesn't_ make sense
to you, don't do it, and if doing something which isn't here _does_ make sense to you, that doesn't necessarily
mean that you shouldn't do it. We'll start with a couple of helpful definitions to frame our discussion.

## On Errors & Exceptions

Most Errors and Exceptions are situations which are either

- Expected (or even unexpected) but represent "inconsistency" or are otherwise eroneous states from a **business logic** perspective (I checked the db for a user who should be there, but they are not)
- Unexpected results from a **computing perspective** (out of memory, stack overflow, unexpected null, etc)

There are some obvious overlaps here, but you should generally expect an error you're handling to
fall into one of these two categories. It's also important to point out that some (many) errors
will fall into both, but it's also good to be able to identify which is which.

## On "Flow Control" and "Handling"

Every language I've operated in have some method for raising exceptions. As mentioned above,
an exception is a state which the current unit of code *cannot or should not recover from*.
The distinction of **current unit of code** is important here. Just because **Subroutine A**
doesn't know how to do something, doesn't mean that its caller (which it doesn't know about),
**Subroutine B** doesn't know how to continue on without a "proper response" from **Subroutine A**. 
In all the most mainstream imperative and OOP languages, it'll come in the form of `try/catch`,
this regularly looks like the following:

```javascript
const parseArray = (a) => {
    // if a is undefined, or its length is 0
    if (!a || a.length === 0) {
        // raise an exception
        throw new Error("I need a defined, non-empty array!");
    }
    // do the rest of the stuff down here
}
```

```java
// Java has this very very friendly throws keyword.
// It's honestly the only language feature I'm aware of which I
// think Java did better than c#
public static Integer parseArray(List<Integer> a) throws ArrayNullException {
    if (a == null || a.size() == 0)
    {
        throw new ArrayNullException();
    }
    // do the rest of the stuff down here
}
```

Now both of the above functions have a basic contract: "You give me an array,
I'll give you something else. If that array is null or empty, I'll throw an
exception".

Again I can't articulate enough how important it is that `parseArray` is not
aware of how the exceptions are used in the **calling context**.

### Flow Control

The above is an example of a particular type of flow control. It instructs
the control of execution to shift from the current context, up to the next
applicable `catch`. In Java I believe you're actually forced to handle
*every kind of exception* which probably would have saved me a lot of embarrassment when
I was younger.

### Handling

As mentioned above, we handle exceptions in a `catch` block:

```javascript
const exampleProcessing = () => {
    const a = [1];
    const b = [];
    try {
        // this would work just fine
        const aRes = parseArray(a);
        // this would throw
        const bRes = parseArray(b);
    } catch (err) {
        // Handle the error
    }
}
```

Alright. Pretty easy, most people who have spent time in software will know
about the above. The real point of this post (and I know I've burried the lead here)
is **how do we `Handle the error`?**, should every function have a try/catch block
in it and log and rethrow? How should "rethrows" look? What even is a "rethrow"?

Well, at least in my own framework, I think that this question has 3 basic answers

## 3 Exceptional Situations

Pretty much every *exception* will fall in 1 of 3 situations (4 if you count one
particularly ugly one which I'll note at the end). Everything is centered around
the notions of **recoverability** and **context**. And by those two terms I mean:

- Can I recover from this particular situation and continue in a business-consistent manner?
- Am I in a context where I have enough control or context in the application to log?

### Exception 1: We're sorry, the voicemail box you've dialed has not been set up yet

We've all made this call (in the USA at least). You call your friend, you want to see
what they're doing, it goes to voicemail and you get a pesky message

> I'm sorry, the voicemail box you've dial has not been set up yet. Goodbye.

Well luckily enough for all of us, we have SMS; but what is the phone company doing here?
There hasn't been any memory leak. The database is *probably* functioning correctly, so
why are we not leaving a voicemail (besides the fact that it's not 1997)?

Well the reason is that we have found ourselves in a state which is **inconsistent**
with leaving a voicemail. I can't leave a voicemail if there's no where to put it!
And because that was the last thing we could do here, it's time to exit the application.

{{<mermaid >}}
sequenceDiagram
    actor Caller
    participant Phone Service
    actor Friend
    Caller->>+Phone Service: Makes call
    Phone Service->>+Friend: Routes Call
    Friend->>-Phone Service: Doesn't Pick Up!
    Phone Service->>+Mailbox Service: Get Mailbox
    Mailbox Service->>-Phone Service: Isn't Set up
    Phone Service->>-Caller: Super annoying message
{{</mermaid>}}

It's easy to imagine that there would be one or even many exceptions here. What
if we were throwing when calling the friend, then throwing when opening the mailbox:

```javascript
const makeCall = (number) => {
    // we'll just throw, they never pick up
    try {
        throw new Error("They didn't pick up");
    } catch (err) {
        // we know what to do with an error in this context, we just open the mailbox and leave the message
        // throwing in this context will throw up to the main context
        const mailbox = openMailbox(number);
        // leave a message like it's 1997
        leaveMessage(mailbox);
    }
}

const openMailbox = (number) => {
    // Annoying message
    throw new Error("The mailbox you're requesting has not been set up yet");
}

const main = () => {
    const number = "77"
    try {
        makeCall(number);
    } catch (_err) {
        // we'll ignore this error and try to recover, we just need the mailbox in this case
    }
}

```
