---
title: Error Handling Paradigms
author: Miles Possing
tags:
  - Code Patterns
draft: false
date: 2024-01-04
---

## Introduction

Error handling is a huge beast, and I'm only going to cover a subset of the overall ideas in it
here. This will serve as a reasonable explanation of how I see error handling, and the majority
of useful cases one will handle or implement. I'll focus on how errors are handled in basic
imperative programs, but the ideas extend upwards to much more advanced programs.

## Disclaimer

Just a couple of important things before we get started:

1. This is only one opinion. There are many opinions out there and I encourage you to seek them out. If you feel like you've found a different or more helpful way to think about it, feel free to [send me an email](mailto:yesreply@possing.tech)
2. Much of what will be discussed in here are local to the kind of work I've been in for the last couple of years. That would be serverless computing (in Azure Functions) and some web development. It's also primarily emphasized single-threaded applications which are distributed, but strongly decoupled and orthogonal. Many of these ideas fly right out the window in any parallel system, or in many distributed architectures
3. Finally these are meant to be a _gentle introduction_ to some basic exception and logging ethos, not a bible for how logging works in all cases. That is to say that I've made much of my life _much_ easier in writing this by simplifying the nuances of exception handling; I break each of these rules all the time.

We'll start with a couple of helpful definitions to frame our discussion.

## On Errors & Exceptions

Most Errors and Exceptions are situations which are either

- Expected (or even unexpected) but represent "inconsistency" or are otherwise erroneous states from a **business logic** perspective (I checked the db for a user who should be there, but they are not)
- Unexpected results from a **computing perspective** (out of memory, stack overflow, unexpected null, etc)

There are some obvious overlaps here, but you should generally expect an error you're handling to
fall into one of these two categories. It's also important to point out that some (many) errors
will fall into both, but it's also good to be able to identify which is which.

## On "Flow Control" and "Handling"

Every language I've operated in have some method for raising exceptions. As mentioned above,
an exception is a state which the current unit of code _cannot or should not recover from_.
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
};
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

As a quick aside, I absolutely _love_ that Java forces any function to declare
all exceptions you throw, and all calling functions need to either handle them,
or also include the throws keyword. It creates a very tight control flow and
ensures that if you ever need to throw something new, while it'll break the build,
it won't break production.

Again I can't articulate enough how important it is that `parseArray` is not
aware of how the exceptions are used in the **calling context**.

### Flow Control

The above is an example of a particular type of flow control. It instructs
the control of execution to shift from the current context, up to the next
applicable `catch`. In Java I believe you're actually forced to handle
_every kind of exception_ which probably would have saved me a lot of embarrassment when
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
};
```

Alright. Pretty easy, most people who have spent time in software will know
about the above. The real point of this post (and I know I've burried the lead here)
is **how do we "Handle the error"?**, should every function have a try/catch block
in it and log and rethrow? How should "rethrows" look? What even is a "rethrow"?

Well, at least in my own framework, I think that this question has 3 basic answers

## 3 Exceptional Situations

Pretty much every _exception_ will fall in 1 of 3 situations (4 if you count one
particularly ugly one which I'll note at the end). Everything is centered around
the notions of **recoverability** and **context**. And by those two terms I mean:

- Can I recover from this particular situation and continue in a business-consistent manner?
- Am I in a context where I have enough control or context in the application to log?

The 3 situations I normally think about exceptions in are the following:

- "I know how to continue, but I want to log this situation"
- "I know how to continue, and I don't need to log this situation"
- "I don't know how to continue at all"

Also, we'll ultimately focus on _expected exceptions_. I might add a brief aside on
unexpected exceptions, but generally speaking we are predicting that a particular
region of code is error prone.

### Exception 1: I can continue but I want to log first

These situations can crop up when you have something which might fail, is indicitive
of an issue, but is not the **end of execution**. In my experience these pop up
in UI applications far more than data pipelines, but there are plenty of overlaps.

For example, you could imagine an api which tries to get a user using a helper function, H.
H is prone to throwing when the user is not found, however. The last thing you really want,
though, is to have your whole application go down just because of one call. It would
be much more correct to return a response in the 400/500 range rather than throwing:

```javascript
route.get("/user", async (req, res) => {
  try {
    // our function prone to exceptions
    const user = getUser(); 
  } catch (err) {
    // 2 qualities of errors, the expected, and everything else
    if (err.type === "UserNotFound") {
      // Here this is actually considered _inside_ the business requirements of
      // the application. A PM might have written this message directly.
      console.warn(err);
      return res.send(404).json({ message: "User not found" });
    }
    console.error(err);
    return res.send(500).json({ message: "Error: " + err.reason });
  }
});
```

Note above that in _both cases_ the function **does not throw**. Rather it handles all
possible cases in error situations. This is because every endpoint in an api is effectively
the entrypoint of the application (after a fashion), so you should handle _ALL_ possible
errors at that point.

### Exception 2: I can continue and I don't need to log

These are the kindest exceptions. They pop up when you are performing an error-prone
operation which is expected to fail some of the time, but does not matter if it
does. One could imagine a situation where a flakey api offers an in memory cache,
and that cache has 2 functions, `get` and `set`. `set` would be bullet-proof, but
some caching implementations (unfortunately) actually throw on `get`. Now, not everyone
is a good software developer, and not every api will be a good one. The obvious
solution is to run far, far away from such implementations, but you sometimes don't have
a choice. So let's picture this:

```javascript
class cache {
  function constructor() {
    this._cache = {};
  }

  function set(key, value) {
    this._cache[key] = value;
  }

  function get(key) {
    if (!this._cache[key]) {
      throw new Error("Key not found");
    }
    return this._cache[key];
  }
}

const memoize = f => {
  const c = new cache();
  return (arg) => {
    try {
      return c.get(arg);
    } catch {
      const res = f(arg);
      c.set(arg);
      // continues in the exceptional case
      return res;
    }
  }
}
```

Cherry-picked examples aside, this case is somewhat less common, but does crop up.

### Exception 3: Oops, I don't know what to do at this point

These are perhaps the most common kinds of exceptions. In fact they're the ones you're
most used to seeing if you're in a mainstream language; because they're literally
_any function without a try/catch block_. This rationale is probably best mixed with
something called the **single responsibility principal** (something I'll have to write
about later), but for now I think that you can think of it like this:

> If I'm in a procedure performing business or technical function X, and something
> happens making it impossible for me to do X, then I am now in an irrecoverable
> state.

Note the importance of thinking about just one X in a function by the way.

It is in this _irrecoverable state_ that you need to make a decision: Will I **add information**?
Or should I **simply let the error bubble up**? Both answers find their way into a healthy
codebase. Here are a couple of examples in javascript, but more interesting would be
just one example in c#

```javascript
// increments the number of times a user has logged in
const incrementLoginCount = async (oid) => {
  const user = await getUserFromDb(oid);
  if (!user) {
    throw new UserNotFoundError("User not found: " + oid);
  }
  // This might throw a DbWriteError
  await setUserCount(oid, user.loginCount + 1);
}

const processLogin = async (oid) => {
  try {
    await incrementLoginCount(oid);
  } catch (err) {
    if (err.type === "UserNotFoundError") {
      // obfuscating throw
      throw new Error("User could not be logged in");
    } else if (err.type === "DbWriteError") {
      // wrapping rethrow
      throw new Error("Could not write to the db", { reason: err });
    } else {
      // basic rethrow
      throw err;
    }
  }
}

const main = async () => {
  const oid = "1234";
  try {
    await processLogin(oid);
  } catch (err) {
    console.error(err);
  }
}
```

A few interesting notes here on this example:

1. `incrementLoginCount` and `processLogin` are not aware of any logging facility. They simply throw up to an outer context and _that_ is what logs if needed. The reasoning behind this is 2-fold:
   1. Logging itself is technically an externality (also known as IO or a side-effect). If `processLogin` were being used in an express app, as well as an azure function, it would have 2 potentially different logging facilities. Best to keep logging at "higher" levels of abstraction and maintain as much purity in the function as possible
   2. It isn't necessarily clear at the point `incrementLoginCount` how it's being used, or if logging would be appropriate. Best to leave it up to the calling client rather than making that decision for them.
2. We have a few different kinds of error handling:
   1. Obfuscating throw: Notice that this becomes a new error boundary. At this point none of the error information moves upwards. This is helpful if you're doing something where you don't want to expose internals of your application to external people (for example a UI app in react probably doesn't want to show _too_ much of its data to users in the console if console logging were to be used).
   2. A wrapping error: C# has these rather nicely, the [`System.Exception` class](https://portal.microsofticm.com/imp/v3/incidents/incident/446702920/summary) actually includes a ctor for this very purpose. The benefit here is that we maintain our **call stack** (an integral part of any exception system) but we're able to add local information to it (ie readable reasons for what went wrong, making ops easier; or basic information on the parameters provided to the function making debugging and reproduction easier).
   3. Basic rethrow: I don't normally like these. If you aren't doing anything, then don't do anything, but if you're doing this "discriminated exception handling", and there is some "catch-all" exception, you'll want to have a final rethrow to ensure that bubbles higher

### Bringing it all together

In conclusion, effective error handling is a balancing act between maintaining operational stability and providing meaningful feedback for debugging and system improvement. It is crucial to understand the context in which an error occurs, assess the recoverability of the situation, and decide the appropriate level of logging and response. This understanding allows developers to build resilient systems that can gracefully handle unexpected states without compromising user experience or system integrity.

Moreover, it's important to recognize that error handling strategies may evolve as the application grows in complexity. Adopting a flexible and thoughtful approach, one that is open to reassessment and refinement, is key to managing errors effectively in any software system. By continually evaluating the context, impact, and frequency of errors, developers can make informed decisions that enhance the robustness and reliability of their applications.

## Bonus: Some examples I've asked ChatGPT to write

You'd better believe that ChatGPT has a hand in all the garbage you read on the internet,
and while I didn't have it write this post (though it did proof it), I did ask it to write
me a few key examples of these ideas and how they might fit together:

### Scenario 1: E-Commerce Website - User Account Management

In an e-commerce application, managing user accounts involves operations like user registration, login, and profile updates. These operations are prone to various exceptions like database connectivity issues, user data validation errors, or even third-party service downtimes (e.g., email service for verification).
Application of Error Handling:

  - **Expected Business Logic Error**: User attempts to register with an already existing email. This triggers a `UserAlreadyExistsException`, which is an expected business logic error. The application catches this exception and sends a user-friendly message to the client, without halting the system.
  - **Unexpected Computing Error**: A database connection failure occurs during user login. This is an unexpected computing error, resulting in a `DatabaseConnectionException`. The application logs this error with details for debugging and sends a generic error message to the user, suggesting to try again later.

### Scenario 2: IoT Device Data Processing

An IoT application that processes data from various sensors. The data is collected, processed, and stored. Errors can occur due to malformed data, sensor disconnection, or network issues.
Application of Error Handling:

  - **Silent Continuation**: A `SensorDataFormatException` occurs when a sensor sends malformed data. The application catches this exception, logs it for maintenance purposes, and continues processing other data without disrupting the entire flow.
  - **Irrecoverable Error**: If a critical sensor loses connection (`SensorConnectionException`), the system cannot proceed with its operations. This exception is logged with high severity, and the system may trigger an alert to the support team or attempt to restart the connection.

### Scenario 3: Cloud-Based File Storage Service

A cloud-based service where users can upload, download, and share files. The system interacts with cloud storage and manages user permissions.
Application of Error Handling:

  - **Recoverable Error with Logging**: During file upload, a `TemporaryStorageException` might occur due to issues with temporary storage. The application catches this, logs the error, and retries the upload process.
  - **Permission Denied Error**: When a user tries to access a file they don’t have permission for, a `PermissionDeniedException` is raised. This is an expected business logic error. The system catches this and informs the user about the lack of permission without logging, as this is a routine and expected occurrence.

## Teaser: Maybe another way?

I've not talked about one of my favorite subjects in computing and flow control yet:
**Referential Transparency**. This is the property that any expression can be replaced
with its sub-expressions. In functional programming what this ultimately boils down to
is the question, "if I replace this function call with its result, does the program
execute the same?" In a future post I'll have a short discussion on why
in this developer's opinion, you should _never_ throw in any language which does not
provide strict enforcement on exception handling.
