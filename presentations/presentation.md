---
marp: true
theme: gaia
---

# Functional Programming
A gentle introduction to functional purity in typescript

---

## Why Functional Patterns?

- Ubiquity
- Clarity
- Correctness
- Fun

---

## Quick Disclaimer

FP, OOP, Zealots all.

---

# What is Purity?

---

### Referential Transparency

```typescript
const divide = (a: number, b: number): number => {
    if (b === 0) {
        throw new Error("Cannot divide by Zero");
    }
    return a / b;
}

const main = () => {
    const a = 1;
    const b = 2;
    const c = 0;
    const r1 = divide(a,b); // can be directly replaced with 0.5
    const r2 = divide(a,c); // cannot be directly replaced with the throw
}
```

---

### Side Effects

```typescript
var global = 0;
const run = () => {

}
```
