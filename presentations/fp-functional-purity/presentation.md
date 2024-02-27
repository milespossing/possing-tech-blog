---
marp: true
---

# Functional Programming: A "gentle" introduction to functional purity in typescript

---

# What will we learn?

- Why should you care about FP?
- What exactly is FP?
- How does it look in typescript (and many other languages)?
- Miles is potentially a lunatic?

---

# Why should *you* care about FP?

- Software is hard
- Testing is hard
- Bugs are annoying and make us look stupid

---

# So what is FP?

- Thou shall not mutate
- Thou shall remain always pure

---

# Where is FP?

- Common frameworks (Spark, Hadoop, React)
- Huge success in the business sector (Jane Street, Twitter, Guaranteed Rate)

---

# Show us some $%#& code already

---

# Accumulate: Imperative

```typescript
interface DataPoint {
  value: number;
  type: string;
}

function AccumulateTheData(data: DataPoint[]): number {
  var result: number = 0;
  for (var i = 0; i < data.length; i++) {
    if (data[i].type === 'TheRightType')
      result += data[i].value;
  }
  return result;
}
```

---

# Accumulate: Functional

```typescript
interface DataPoint {
  value: number;
  type: string;
}

function AccumulateTheData(data: DataPoint[]): number {
  return data
    .filter(d => d.type === 'TheRIghtType')
    .map(d => d.value)
    .reduce((acc,a) => acc + a)
}
```

---

# The Filter, Map, Reduce

- Yeah unfortunately it turns out this is something like 90% of the code we write

---

# Undefined? Imperative

```typescript
interface Contract {
  status: string;
  // ...
}

function FindActiveContract(contracts: Contract[]): Contract {
  // find returns the first object matching the predicate, otherwise returns undefined
  return contracts.find(c => c.status === 'Active');
}
```

---

# But we have other Options: Functional

```typescript
type Option<A> = None | Some<A>
```

```typescript
import * as O from 'fp-ts/Option';

interface Contract {
  status: string;
  // ...
}

function FindActiveContract(contracts: Contract[]): O.Option<Contract> {
  // find returns the first object matching the predicate, otherwise returns undefined
  const result = contracts.find(c => c.status === 'Active');
  return O.fromNullable(result);
}
```

---

# But Why?

- We process data compositionally

---

# Let's take a look

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
  const contractId: string = GetContractId(activeContract);
}
```

---

# I guess we could do better? 

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
    // some checking to do
}
```

---

# Generalized "binding"

We see this *everywhere*. DRY this and DRY that and no one is asking why we don't have a better way to do **null checks**?

They've played us for fools

---

# We can do a bit of math to this, though!

```typescript
import * as O from 'fp-ts/Option';

interface Contract {
  status: string;
  contractId: string;
}

function FindActiveContract(contracts: Contract[]): O.Option<Contract>;

const GetContractId = (contract: Contract): string => contract.contractId;

const main = () => {
  const contracts: Contract[];
  const active: O.Option<Contract> = FindActiveContract(contracts);
  const contractId: O.Option<string> = O.map(GetContractId)(active);
}
```

At this point we're still in the context of the `Option`. We can keep our data in that context
indefinitely

---

### If we wanted to, and we could continue to map it whenever we want:

```typescript
const asLowerId: O.Option<string> = O.map((id: string) => id.toLowerCase())(contractId);
```

---

# Or better articulated in a *pipe*

```typescript
import { pipe } from 'fp-ts/function';

function FindActiveContract(contracts: Contract[]): O.Option<Contract>;
const GetContractId = (contract: Contract): string => contract.contractId;

const main = () => {
  const contracts: Contract[];
  const contractId: O.Option<string> = pipe(
    contracts,
    FindActiveContract,
    O.map(GetContractId),
  );
}
```

The above is the same as writing: 

```typescript
O.map(GetContractId)(FindActiveContract(contracts))
```

---

# I'm not going to tell you about Monads

- I don't have time, to be honest
- But you are seeing them right now

---

# Three kinds of code

- Data
- Computations
- Actions

---

# Data

```typescript
const contract: Contract = {
  contractId: '1234',
  status: 'Active',
};
```

---

# Computation

```typescript
const getContractId = (contract: Contract) => contract.contractId;
```

---

# Actions

```typescript
const getContracts = (): Promise<Contract[]> => {
  return db.collection('contracts').find();
}
```

## A few things about this

- It is no longer CPU bound
- It does not return the same value every time
- It might fail

---

# Errors: Imperative

```typescript
// "Just let it throw"
const divide = (a: number, b: number): number => a / b;

// "Explicit throw"
const divide = (a: number, b: number): number => {
  if (b === 0) throw new Error("You're not powerful enough to divide by zero");
}
```

---

# Eithers: Functional

```typescript
import * as E from 'fp-ts/Either';

// "Just let it throw"
const divide = (a: number, b: number): E.Either<Error, number> => {
  if (b === 0) return E.left("You're STILL not powerful enough");
  return E.right(a / b);
};
```

# These can be mapped as well:

```typescript
const divideBy = (b: number) => (a: number): E.Either<Error, number> =>
  b === 0 ? E.left("This is getting embarrassing -_-") : E.right(a / b);
const add = (a: number) => (b: number): number => a + b;
const divideAdd = (a: number, b: number) => pipe(
  a,
  divideBy(b),
  E.map(add(1)),
);
```

---

# Final Boss

```typescript
import * as O from 'fp-ts/Option';
import * as A from 'fp-ts/Array';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';

// Here's an action, we need to leave function execution to actually run this
const getContracts: TaskEither<Error, Contract[]> = TE.tryCatch(() => db.collection('contracts').find(), E.toError);
const getActiveContract = (contracts: Contract[]): Option<Contract> => pipe(
  contracts,
  // findFirst returns an Option
  A.findFirst(c => c.status === 'Active'),
);
const getContractId = (contract: Contract) => contract.contractId;

const main = pipe(
  getContracts, // :: TaskEither<Error, Contract[]>
  TE.map(getActiveContract), // :: TaskEither<Error, Option<Contract>> (yikes)
  TE.flatMapOption(() => new Error('No active contracts found')), // :: TaskEither<Error, Contract> when we have None, we return Left
  TE.map(getContractId), // :: TaskEither<Error, string>
  // continue execution
);
```

---

# Alright, you made it

