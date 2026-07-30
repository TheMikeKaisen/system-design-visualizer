import { JavaArrayScenario } from "./arrays-engine";

const codePhase1 = `public class Main {
    public static void main(String[] args) {
        int[] numbers = new int[5];
        System.out.println(numbers[2]);
        numbers[2] = 50;
    }
}`;
const codePhase2 = `public class Main {
    public static void main(String[] args) {
        int[] numbers = new int[5]; // Assume already allocated
        int[] another = numbers;
        another[0] = 99;
        numbers = new int[3];
        numbers = null;
        another = null;
    }
}`;
const codePhase3 = `public class Main {
    public static void main(String[] args) {
        Student[] students = new Student[3];
        students[0] = new Student();
    }
}`;
const codePhase4 = `public class Main {
    public static void main(String[] args) {
        int[][] matrix = new int[2][3];
        
        int[][] jagged = new int[3][];
        jagged[0] = new int[2];
        jagged[1] = new int[5];
    }
}`;

export const javaArraysPhases: JavaArrayScenario[] = [
  {
    id: "phase1",
    title: "Phase 1: Creation & Access",
    description: "How 1D primitive arrays are allocated and accessed.",
    steps: [
      {
        id: "p1-s1",
        explanation: "Execution starts. The JVM creates a thread stack and pushes a Stack Frame for `main()`.",
        notes: [
          { title: "The Stack", content: "Local variables live here. They are destroyed when the method returns." },
          { title: "The Heap", content: "Objects and Arrays live here. They persist until garbage collected." }
        ],
        code: codePhase1,
        activeLine: 2,
        stack: [{ name: "main()", variables: [] }],
        heap: {}
      },
      {
        id: "p1-s2",
        explanation: "We hit `new int[5]`. The JVM allocates contiguous memory on the Heap for 5 integers and initializes them to 0.",
        notes: [
          { title: "Default Initialization", content: "Unlike local variables, array elements in Java are automatically initialized to their default values (0 for int, false for boolean, null for references)." }
        ],
        code: codePhase1,
        activeLine: 3,
        stack: [{ name: "main()", variables: [{ name: "numbers", type: "int[]", value: "0x100" }] }],
        heap: {
          "0x100": {
            type: "PrimitiveArray",
            elementType: "int",
            length: 5,
            elements: [0, 0, 0, 0, 0]
          }
        }
      },
      {
        id: "p1-s3",
        explanation: "To read `numbers[2]`, the JVM follows the reference from the stack (`0x100`) to the heap, then jumps to index 2.",
        notes: [
          { title: "O(1) Access Time", content: "Because array memory is contiguous, the JVM can calculate the exact memory address: `BaseAddress + (Index * ElementSize)`. Thus, reading from an array is extremely fast." }
        ],
        code: codePhase1,
        activeLine: 4,
        stack: [{ name: "main()", variables: [{ name: "numbers", type: "int[]", value: "0x100" }] }],
        heap: {
          "0x100": {
            type: "PrimitiveArray",
            elementType: "int",
            length: 5,
            elements: [0, 0, 0, 0, 0]
          }
        }
      },
      {
        id: "p1-s4",
        explanation: "We write `50` into `numbers[2]`. The value in the heap is updated.",
        code: codePhase1,
        activeLine: 5,
        stack: [{ name: "main()", variables: [{ name: "numbers", type: "int[]", value: "0x100" }] }],
        heap: {
          "0x100": {
            type: "PrimitiveArray",
            elementType: "int",
            length: 5,
            elements: [0, 0, 50, 0, 0]
          }
        }
      }
    ]
  },
  {
    id: "phase2",
    title: "Phase 2: References & Garbage Collection",
    description: "What happens when multiple variables point to the same array.",
    steps: [
      {
        id: "p2-s1",
        explanation: "We start with `numbers` pointing to an array on the heap.",
        code: codePhase2,
        activeLine: 3,
        stack: [{ name: "main()", variables: [{ name: "numbers", type: "int[]", value: "0x100" }] }],
        heap: {
          "0x100": {
            type: "PrimitiveArray",
            elementType: "int",
            length: 5,
            elements: [0, 0, 0, 0, 0]
          }
        }
      },
      {
        id: "p2-s2",
        explanation: "`int[] another = numbers;` copies the **reference**, not the array! Both variables now point to the exact same object in the heap.",
        notes: [
          { title: "Pass By Value", content: "In Java, everything is pass-by-value. But for objects and arrays, the *value* being passed or assigned is the *reference* (the memory address)." }
        ],
        code: codePhase2,
        activeLine: 4,
        stack: [{ name: "main()", variables: [
          { name: "numbers", type: "int[]", value: "0x100" },
          { name: "another", type: "int[]", value: "0x100" }
        ] }],
        heap: {
          "0x100": {
            type: "PrimitiveArray",
            elementType: "int",
            length: 5,
            elements: [0, 0, 0, 0, 0]
          }
        }
      },
      {
        id: "p2-s3",
        explanation: "Because both variables point to the same array, modifying `another[0]` also modifies what `numbers[0]` sees.",
        code: codePhase2,
        activeLine: 5,
        stack: [{ name: "main()", variables: [
          { name: "numbers", type: "int[]", value: "0x100" },
          { name: "another", type: "int[]", value: "0x100" }
        ] }],
        heap: {
          "0x100": {
            type: "PrimitiveArray",
            elementType: "int",
            length: 5,
            elements: [99, 0, 0, 0, 0]
          }
        }
      },
      {
        id: "p2-s4",
        explanation: "`numbers = new int[3];` allocates a *brand new* array on the heap, and updates `numbers` to point to it. `another` still points to the old array.",
        code: codePhase2,
        activeLine: 6,
        stack: [{ name: "main()", variables: [
          { name: "numbers", type: "int[]", value: "0x200" },
          { name: "another", type: "int[]", value: "0x100" }
        ] }],
        heap: {
          "0x100": {
            type: "PrimitiveArray",
            elementType: "int",
            length: 5,
            elements: [99, 0, 0, 0, 0]
          },
          "0x200": {
            type: "PrimitiveArray",
            elementType: "int",
            length: 3,
            elements: [0, 0, 0]
          }
        }
      },
      {
        id: "p2-s5",
        explanation: "We set `numbers = null`. Now `0x200` has zero references pointing to it. It becomes unreachable.",
        code: codePhase2,
        activeLine: 7,
        stack: [{ name: "main()", variables: [
          { name: "numbers", type: "int[]", value: "null" },
          { name: "another", type: "int[]", value: "0x100" }
        ] }],
        heap: {
          "0x100": {
            type: "PrimitiveArray",
            elementType: "int",
            length: 5,
            elements: [99, 0, 0, 0, 0]
          },
          "0x200": {
            type: "PrimitiveArray",
            elementType: "int",
            length: 3,
            elements: [0, 0, 0],
            isGarbageCollected: true
          }
        }
      },
      {
        id: "p2-s6",
        explanation: "We set `another = null`. Now `0x100` also has zero references. The Garbage Collector will eventually free this memory.",
        code: codePhase2,
        activeLine: 8,
        stack: [{ name: "main()", variables: [
          { name: "numbers", type: "int[]", value: "null" },
          { name: "another", type: "int[]", value: "null" }
        ] }],
        heap: {
          "0x100": {
            type: "PrimitiveArray",
            elementType: "int",
            length: 5,
            elements: [99, 0, 0, 0, 0],
            isGarbageCollected: true
          },
          "0x200": {
            type: "PrimitiveArray",
            elementType: "int",
            length: 3,
            elements: [0, 0, 0],
            isGarbageCollected: true
          }
        }
      }
    ]
  },
  {
    id: "phase3",
    title: "Phase 3: Object Arrays",
    description: "An array of objects is really an array of references.",
    steps: [
      {
        id: "p3-s1",
        explanation: "`Student[] students = new Student[3];` creates an array on the heap. But it does NOT create any Student objects! It creates an array of 3 references, initialized to `null`.",
        notes: [
          { title: "NullPointerException Risk", content: "Because object arrays start with null references, trying to access `students[0].name` right now would throw a NullPointerException." }
        ],
        code: codePhase3,
        activeLine: 3,
        stack: [{ name: "main()", variables: [
          { name: "students", type: "Student[]", value: "0x300" }
        ] }],
        heap: {
          "0x300": {
            type: "ObjectArray",
            elementType: "Student",
            length: 3,
            elements: ["null", "null", "null"]
          }
        }
      },
      {
        id: "p3-s2",
        explanation: "`new Student()` allocates a Student object on the heap (e.g. at 0x400). Then, we store its reference `0x400` in `students[0]`.",
        code: codePhase3,
        activeLine: 4,
        stack: [{ name: "main()", variables: [
          { name: "students", type: "Student[]", value: "0x300" }
        ] }],
        heap: {
          "0x300": {
            type: "ObjectArray",
            elementType: "Student",
            length: 3,
            elements: ["0x400", "null", "null"]
          },
          "0x400": {
            type: "ClassInstance",
            className: "Student",
            fields: {}
          }
        }
      }
    ]
  },
  {
    id: "phase4",
    title: "Phase 4: Multi-Dimensional Arrays",
    description: "In Java, a 2D array is just an array of arrays.",
    steps: [
      {
        id: "p4-s1",
        explanation: "`new int[2][3]` creates an outer array of 2 references, and immediately allocates two inner int arrays of length 3.",
        notes: [
          { title: "No True 2D Arrays", content: "Unlike C++ which allocates a single contiguous block of `row * col` memory, Java allocates each row as a completely separate array object on the heap." }
        ],
        code: codePhase4,
        activeLine: 3,
        stack: [{ name: "main()", variables: [
          { name: "matrix", type: "int[][]", value: "0x500" }
        ] }],
        heap: {
          "0x500": {
            type: "ObjectArray",
            elementType: "int[]",
            length: 2,
            elements: ["0x501", "0x502"]
          },
          "0x501": {
            type: "PrimitiveArray",
            elementType: "int",
            length: 3,
            elements: [0, 0, 0]
          },
          "0x502": {
            type: "PrimitiveArray",
            elementType: "int",
            length: 3,
            elements: [0, 0, 0]
          }
        }
      },
      {
        id: "p4-s2",
        explanation: "For Jagged arrays, `new int[3][]` allocates the outer array, but leaves the inner arrays as `null`.",
        code: codePhase4,
        activeLine: 5,
        stack: [{ name: "main()", variables: [
          { name: "matrix", type: "int[][]", value: "0x500" },
          { name: "jagged", type: "int[][]", value: "0x600" }
        ] }],
        heap: {
          "0x500": {
            type: "ObjectArray",
            elementType: "int[]",
            length: 2,
            elements: ["0x501", "0x502"]
          },
          "0x501": {
            type: "PrimitiveArray",
            elementType: "int",
            length: 3,
            elements: [0, 0, 0]
          },
          "0x502": {
            type: "PrimitiveArray",
            elementType: "int",
            length: 3,
            elements: [0, 0, 0]
          },
          "0x600": {
            type: "ObjectArray",
            elementType: "int[]",
            length: 3,
            elements: ["null", "null", "null"]
          }
        }
      },
      {
        id: "p4-s3",
        explanation: "We can allocate each row individually, with different lengths! This is why they are called Jagged Arrays.",
        code: codePhase4,
        activeLine: 7,
        stack: [{ name: "main()", variables: [
          { name: "matrix", type: "int[][]", value: "0x500" },
          { name: "jagged", type: "int[][]", value: "0x600" }
        ] }],
        heap: {
          "0x500": {
            type: "ObjectArray",
            elementType: "int[]",
            length: 2,
            elements: ["0x501", "0x502"]
          },
          "0x501": {
            type: "PrimitiveArray",
            elementType: "int",
            length: 3,
            elements: [0, 0, 0]
          },
          "0x502": {
            type: "PrimitiveArray",
            elementType: "int",
            length: 3,
            elements: [0, 0, 0]
          },
          "0x600": {
            type: "ObjectArray",
            elementType: "int[]",
            length: 3,
            elements: ["0x601", "0x602", "null"]
          },
          "0x601": {
            type: "PrimitiveArray",
            elementType: "int",
            length: 2,
            elements: [0, 0]
          },
          "0x602": {
            type: "PrimitiveArray",
            elementType: "int",
            length: 5,
            elements: [0, 0, 0, 0, 0]
          }
        }
      }
    ]
  }
];
