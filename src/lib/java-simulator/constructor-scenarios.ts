import { OOPSimulationScenario } from './oop-engine';

const codeString = `class Student {
    String name;  // instance variable (default: NULL)
    int age;      // instance variable (default: 0) 

    // Default Constructor
    Student() {
        name = "Unknown";
        age = 18;
    }

    // Parameterized Constructor
    Student(String n, int a) {
        name = n;
        age = a;
    }
}

public class Demo {
    public static void main(String[] args) {
        int localAge; // Local variable (no default value)
        
        Student s1 = new Student();
        Student s2 = new Student("Aditya", 28);
    }
}`;

export const constructorScenario: OOPSimulationScenario = {
  id: "java-constructors",
  title: "Java Constructors",
  description: "Visualize how constructors initialize objects, and the difference between instance variables and local variables.",
  steps: [
    {
      id: "step-1-start",
      explanation: "Execution begins in the main method. An empty array of Strings is passed as args.",
      code: codeString,
      activeLine: 19,
      stackFrames: [
        {
          id: "frame-main",
          methodName: "main(String[] args)",
          isActive: true,
          variables: [
            { id: "v_args", name: "args", type: "String[]", value: "[]", isReference: true }
          ]
        }
      ],
      consoleOutput: [],
      heapObjects: []
    },
    {
      id: "step-2-local-var",
      explanation: "A local variable 'localAge' is declared. Unlike instance variables, local variables are NOT given default values by the JVM. It is currently uninitialized. Trying to access a local variable before its definition results in a compilation error.",
      code: codeString,
      activeLine: 20,
      stackFrames: [
        {
          id: "frame-main",
          methodName: "main(String[] args)",
          isActive: true,
          variables: [
            { id: "v_args", name: "args", type: "String[]", value: "[]", isReference: true },
            { id: "v_localAge", name: "localAge", type: "int", value: "<uninitialized>", isReference: false }
          ]
        }
      ],
      consoleOutput: [],
      heapObjects: []
    },
    {
      id: "step-3-new-allocation",
      explanation: "The 'new' keyword allocates memory in the Heap for a Student object. Notice how instance variables ('name' and 'age') get default values (null and 0) automatically!",
      code: codeString,
      activeLine: 22,
      stackFrames: [
        {
          id: "frame-main",
          methodName: "main(String[] args)",
          isActive: true,
          variables: [
            { id: "v_args", name: "args", type: "String[]", value: "[]", isReference: true },
            { id: "v_localAge", name: "localAge", type: "int", value: "<uninitialized>", isReference: false }
          ]
        }
      ],
      consoleOutput: [],
      heapObjects: [
        {
          id: "@1001",
          className: "Student",
          isNew: true,
          fields: [
            { id: "f_name1", name: "name", type: "String", value: "null", isReference: true },
            { id: "f_age1", name: "age", type: "int", value: "0", isReference: false }
          ]
        }
      ]
    },
    {
      id: "step-4-default-constructor-push",
      explanation: "A constructor is a special method with the exact same name as the class and no return type. The Student() constructor frame is pushed to the stack. 'this' points to the new object.",
      code: codeString,
      activeLine: 6,
      stackFrames: [
        {
          id: "frame-init-1",
          methodName: "Student()",
          isActive: true,
          variables: [
            { id: "v_this1", name: "this", type: "Student", value: "@1001", isReference: true, refId: "@1001" }
          ]
        },
        {
          id: "frame-main",
          methodName: "main(String[] args)",
          isActive: false,
          variables: [
            { id: "v_args", name: "args", type: "String[]", value: "[]", isReference: true },
            { id: "v_localAge", name: "localAge", type: "int", value: "<uninitialized>", isReference: false }
          ]
        }
      ],
      consoleOutput: [],
      heapObjects: [
        {
          id: "@1001",
          className: "Student",
          fields: [
            { id: "f_name1", name: "name", type: "String", value: "null", isReference: true },
            { id: "f_age1", name: "age", type: "int", value: "0", isReference: false }
          ]
        }
      ]
    },
    {
      id: "step-5-default-constructor-assign1",
      explanation: "The instance variable 'name' is initialized to \"Unknown\".",
      code: codeString,
      activeLine: 7,
      stackFrames: [
        {
          id: "frame-init-1",
          methodName: "Student()",
          isActive: true,
          variables: [
            { id: "v_this1", name: "this", type: "Student", value: "@1001", isReference: true, refId: "@1001" }
          ]
        },
        {
          id: "frame-main",
          methodName: "main(String[] args)",
          isActive: false,
          variables: [
            { id: "v_args", name: "args", type: "String[]", value: "[]", isReference: true },
            { id: "v_localAge", name: "localAge", type: "int", value: "<uninitialized>", isReference: false }
          ]
        }
      ],
      consoleOutput: [],
      heapObjects: [
        {
          id: "@1001",
          className: "Student",
          fields: [
            { id: "f_name1", name: "name", type: "String", value: '"Unknown"', isReference: true },
            { id: "f_age1", name: "age", type: "int", value: "0", isReference: false }
          ]
        }
      ]
    },
    {
      id: "step-6-default-constructor-assign2",
      explanation: "The instance variable 'age' is initialized to 18.",
      code: codeString,
      activeLine: 8,
      stackFrames: [
        {
          id: "frame-init-1",
          methodName: "Student()",
          isActive: true,
          variables: [
            { id: "v_this1", name: "this", type: "Student", value: "@1001", isReference: true, refId: "@1001" }
          ]
        },
        {
          id: "frame-main",
          methodName: "main(String[] args)",
          isActive: false,
          variables: [
            { id: "v_args", name: "args", type: "String[]", value: "[]", isReference: true },
            { id: "v_localAge", name: "localAge", type: "int", value: "<uninitialized>", isReference: false }
          ]
        }
      ],
      consoleOutput: [],
      heapObjects: [
        {
          id: "@1001",
          className: "Student",
          fields: [
            { id: "f_name1", name: "name", type: "String", value: '"Unknown"', isReference: true },
            { id: "f_age1", name: "age", type: "int", value: "18", isReference: false }
          ]
        }
      ]
    },
    {
      id: "step-7-default-constructor-pop",
      explanation: "Constructor finishes and pops off the stack. The reference 's1' in main now points to the fully initialized object.",
      code: codeString,
      activeLine: 22,
      stackFrames: [
        {
          id: "frame-main",
          methodName: "main(String[] args)",
          isActive: true,
          variables: [
            { id: "v_args", name: "args", type: "String[]", value: "[]", isReference: true },
            { id: "v_localAge", name: "localAge", type: "int", value: "<uninitialized>", isReference: false },
            { id: "v_s1", name: "s1", type: "Student", value: "@1001", isReference: true, refId: "@1001" }
          ]
        }
      ],
      consoleOutput: [],
      heapObjects: [
        {
          id: "@1001",
          className: "Student",
          fields: [
            { id: "f_name1", name: "name", type: "String", value: '"Unknown"', isReference: true },
            { id: "f_age1", name: "age", type: "int", value: "18", isReference: false }
          ]
        }
      ]
    },
    {
      id: "step-8-new-allocation-2",
      explanation: "A second object is allocated. Once again, before the constructor runs, the JVM sets the instance variables to their default values (null, 0).",
      code: codeString,
      activeLine: 23,
      stackFrames: [
        {
          id: "frame-main",
          methodName: "main(String[] args)",
          isActive: true,
          variables: [
            { id: "v_args", name: "args", type: "String[]", value: "[]", isReference: true },
            { id: "v_localAge", name: "localAge", type: "int", value: "<uninitialized>", isReference: false },
            { id: "v_s1", name: "s1", type: "Student", value: "@1001", isReference: true, refId: "@1001" }
          ]
        }
      ],
      consoleOutput: [],
      heapObjects: [
        {
          id: "@1001",
          className: "Student",
          fields: [
            { id: "f_name1", name: "name", type: "String", value: '"Unknown"', isReference: true },
            { id: "f_age1", name: "age", type: "int", value: "18", isReference: false }
          ]
        },
        {
          id: "@1002",
          className: "Student",
          isNew: true,
          fields: [
            { id: "f_name2", name: "name", type: "String", value: "null", isReference: true },
            { id: "f_age2", name: "age", type: "int", value: "0", isReference: false }
          ]
        }
      ]
    },
    {
      id: "step-9-param-constructor-push",
      explanation: "This time, the parameterized constructor is called. This is 'Constructor Overloading'. Notice the local variables 'n' and 'a' inside this stack frame holding our arguments.",
      code: codeString,
      activeLine: 12,
      stackFrames: [
        {
          id: "frame-init-2",
          methodName: "Student(String n, int a)",
          isActive: true,
          variables: [
            { id: "v_this2", name: "this", type: "Student", value: "@1002", isReference: true, refId: "@1002" },
            { id: "v_n", name: "n", type: "String", value: '"Aditya"', isReference: true },
            { id: "v_a", name: "a", type: "int", value: "28", isReference: false }
          ]
        },
        {
          id: "frame-main",
          methodName: "main(String[] args)",
          isActive: false,
          variables: [
            { id: "v_args", name: "args", type: "String[]", value: "[]", isReference: true },
            { id: "v_localAge", name: "localAge", type: "int", value: "<uninitialized>", isReference: false },
            { id: "v_s1", name: "s1", type: "Student", value: "@1001", isReference: true, refId: "@1001" }
          ]
        }
      ],
      consoleOutput: [],
      heapObjects: [
        {
          id: "@1001",
          className: "Student",
          fields: [
            { id: "f_name1", name: "name", type: "String", value: '"Unknown"', isReference: true },
            { id: "f_age1", name: "age", type: "int", value: "18", isReference: false }
          ]
        },
        {
          id: "@1002",
          className: "Student",
          fields: [
            { id: "f_name2", name: "name", type: "String", value: "null", isReference: true },
            { id: "f_age2", name: "age", type: "int", value: "0", isReference: false }
          ]
        }
      ]
    },
    {
      id: "step-10-param-constructor-assign1",
      explanation: "The instance variable 'name' takes the value of the local parameter 'n'.",
      code: codeString,
      activeLine: 13,
      stackFrames: [
        {
          id: "frame-init-2",
          methodName: "Student(String n, int a)",
          isActive: true,
          variables: [
            { id: "v_this2", name: "this", type: "Student", value: "@1002", isReference: true, refId: "@1002" },
            { id: "v_n", name: "n", type: "String", value: '"Aditya"', isReference: true },
            { id: "v_a", name: "a", type: "int", value: "28", isReference: false }
          ]
        },
        {
          id: "frame-main",
          methodName: "main(String[] args)",
          isActive: false,
          variables: [
            { id: "v_args", name: "args", type: "String[]", value: "[]", isReference: true },
            { id: "v_localAge", name: "localAge", type: "int", value: "<uninitialized>", isReference: false },
            { id: "v_s1", name: "s1", type: "Student", value: "@1001", isReference: true, refId: "@1001" }
          ]
        }
      ],
      consoleOutput: [],
      heapObjects: [
        {
          id: "@1001",
          className: "Student",
          fields: [
            { id: "f_name1", name: "name", type: "String", value: '"Unknown"', isReference: true },
            { id: "f_age1", name: "age", type: "int", value: "18", isReference: false }
          ]
        },
        {
          id: "@1002",
          className: "Student",
          fields: [
            { id: "f_name2", name: "name", type: "String", value: '"Aditya"', isReference: true },
            { id: "f_age2", name: "age", type: "int", value: "0", isReference: false }
          ]
        }
      ]
    },
    {
      id: "step-11-param-constructor-assign2",
      explanation: "The instance variable 'age' takes the value of the local parameter 'a'.",
      code: codeString,
      activeLine: 14,
      stackFrames: [
        {
          id: "frame-init-2",
          methodName: "Student(String n, int a)",
          isActive: true,
          variables: [
            { id: "v_this2", name: "this", type: "Student", value: "@1002", isReference: true, refId: "@1002" },
            { id: "v_n", name: "n", type: "String", value: '"Aditya"', isReference: true },
            { id: "v_a", name: "a", type: "int", value: "28", isReference: false }
          ]
        },
        {
          id: "frame-main",
          methodName: "main(String[] args)",
          isActive: false,
          variables: [
            { id: "v_args", name: "args", type: "String[]", value: "[]", isReference: true },
            { id: "v_localAge", name: "localAge", type: "int", value: "<uninitialized>", isReference: false },
            { id: "v_s1", name: "s1", type: "Student", value: "@1001", isReference: true, refId: "@1001" }
          ]
        }
      ],
      consoleOutput: [],
      heapObjects: [
        {
          id: "@1001",
          className: "Student",
          fields: [
            { id: "f_name1", name: "name", type: "String", value: '"Unknown"', isReference: true },
            { id: "f_age1", name: "age", type: "int", value: "18", isReference: false }
          ]
        },
        {
          id: "@1002",
          className: "Student",
          fields: [
            { id: "f_name2", name: "name", type: "String", value: '"Aditya"', isReference: true },
            { id: "f_age2", name: "age", type: "int", value: "28", isReference: false }
          ]
        }
      ]
    },
    {
      id: "step-12-param-constructor-pop",
      explanation: "Parameterized constructor completes and pops off the stack. 's2' now holds the memory address of the second Student object.",
      code: codeString,
      activeLine: 23,
      stackFrames: [
        {
          id: "frame-main",
          methodName: "main(String[] args)",
          isActive: true,
          variables: [
            { id: "v_args", name: "args", type: "String[]", value: "[]", isReference: true },
            { id: "v_localAge", name: "localAge", type: "int", value: "<uninitialized>", isReference: false },
            { id: "v_s1", name: "s1", type: "Student", value: "@1001", isReference: true, refId: "@1001" },
            { id: "v_s2", name: "s2", type: "Student", value: "@1002", isReference: true, refId: "@1002" }
          ]
        }
      ],
      consoleOutput: [],
      heapObjects: [
        {
          id: "@1001",
          className: "Student",
          fields: [
            { id: "f_name1", name: "name", type: "String", value: '"Unknown"', isReference: true },
            { id: "f_age1", name: "age", type: "int", value: "18", isReference: false }
          ]
        },
        {
          id: "@1002",
          className: "Student",
          fields: [
            { id: "f_name2", name: "name", type: "String", value: '"Aditya"', isReference: true },
            { id: "f_age2", name: "age", type: "int", value: "28", isReference: false }
          ]
        }
      ]
    },
    {
      id: "step-13-end",
      explanation: "Execution finishes. If you did not provide any constructors, the JVM would have provided a hidden, empty default constructor for you automatically!",
      code: codeString,
      activeLine: 24,
      stackFrames: [
        {
          id: "frame-main",
          methodName: "main(String[] args)",
          isActive: true,
          variables: [
            { id: "v_args", name: "args", type: "String[]", value: "[]", isReference: true },
            { id: "v_localAge", name: "localAge", type: "int", value: "<uninitialized>", isReference: false },
            { id: "v_s1", name: "s1", type: "Student", value: "@1001", isReference: true, refId: "@1001" },
            { id: "v_s2", name: "s2", type: "Student", value: "@1002", isReference: true, refId: "@1002" }
          ]
        }
      ],
      consoleOutput: [],
      heapObjects: [
        {
          id: "@1001",
          className: "Student",
          fields: [
            { id: "f_name1", name: "name", type: "String", value: '"Unknown"', isReference: true },
            { id: "f_age1", name: "age", type: "int", value: "18", isReference: false }
          ]
        },
        {
          id: "@1002",
          className: "Student",
          fields: [
            { id: "f_name2", name: "name", type: "String", value: '"Aditya"', isReference: true },
            { id: "f_age2", name: "age", type: "int", value: "28", isReference: false }
          ]
        }
      ]
    }
  ]
};
