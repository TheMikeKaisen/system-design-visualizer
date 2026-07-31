import { OOPSimulationScenario, OOPMemoryState, OOPStackFrame, OOPHeapObject } from "./oop-engine";
import { constructorScenario } from "./constructor-scenarios";

const codeString = `public class Demo {
    public static void main(String[] args) {
        Student s1 = new Student();
        Student s2 = new Student();

        s1.name = "Aditya";
        s1.age = 28;
        s1.rollNumber = 101;
        s1.college = "IIT Guwahati";

        s2.name = "Rohit";
        s2.age = 28;
        s2.rollNumber = 102;
        s2.college = "IIT Guwahati";

        s1.markAttendance();
        s2.markAttendance();

        s1.print();
        s2.print();
    }
}

class Student {
    String name;
    int age;
    int rollNumber;
    String college;

    void markAttendance() {
        System.out.println("Attendance marked by " + name);
    }

    void print() {
        System.out.println(name + " , " + age + " , " + rollNumber + " , " + college);
    }
}`;

const defaultStudentFields = () => [
  { id: "f_name", name: "name", type: "String", value: "null", isReference: true, refId: undefined },
  { id: "f_age", name: "age", type: "int", value: "0", isReference: false },
  { id: "f_roll", name: "rollNumber", type: "int", value: "0", isReference: false },
  { id: "f_college", name: "college", type: "String", value: "null", isReference: true, refId: undefined }
];

export const OOP_SCENARIOS: OOPSimulationScenario[] = [
  {
    id: "oop-basics-1",
    title: "Classes and Objects",
    description: "Visualize how objects are created in the Heap and referenced from the Stack.",
    steps: [
      {
        id: "step-1-init",
        explanation: "Welcome to the Java OOP Memory Simulator. Let's trace how the JVM allocates memory when executing a Java program. Initially, both the Stack and the Heap are empty.",
        code: codeString,
        activeLine: null,
        stackFrames: [],
        consoleOutput: [],
        heapObjects: []
      },
      {
        id: "step-2-main",
        explanation: "The JVM invokes the main method. A new frame is pushed onto the Call Stack for 'main'. The local variable 'args' is created.",
        code: codeString,
        activeLine: 2,
        stackFrames: [
          {
            id: "frame-main",
            methodName: "main(String[] args)",
            isActive: true,
            variables: [
              { id: "v_args", name: "args", type: "String[]", value: "[]", isReference: true, refId: "@args_array" }
            ]
          }
        ],
        consoleOutput: [],
        heapObjects: []
      },
      {
        id: "step-3-new-s1",
        explanation: "We encounter 'new Student()'. The JVM allocates memory in the Heap for a new Student object. Notice how its attributes are initialized to default values (null and 0).",
        code: codeString,
        activeLine: 3,
        stackFrames: [
          {
            id: "frame-main",
            methodName: "main(String[] args)",
            isActive: true,
            variables: [
              { id: "v_args", name: "args", type: "String[]", value: "[]", isReference: true, refId: "@args_array" }
            ]
          }
        ],
        consoleOutput: [],
        heapObjects: [
          {
            id: "@1001",
            className: "Student",
            isNew: true,
            fields: defaultStudentFields()
          }
        ]
      },
      {
        id: "step-4-assign-s1",
        explanation: "The reference variable 's1' is created in the Stack. It stores the memory address of the newly created Student object in the Heap, acting as a pointer.",
        code: codeString,
        activeLine: 3,
        stackFrames: [
          {
            id: "frame-main",
            methodName: "main(String[] args)",
            isActive: true,
            variables: [
              { id: "v_args", name: "args", type: "String[]", value: "[]", isReference: true, refId: "@args_array" },
              { id: "v_s1", name: "s1", type: "Student", value: "@1001", isReference: true, refId: "@1001" }
            ]
          }
        ],
        consoleOutput: [],
        heapObjects: [
          {
            id: "@1001",
            className: "Student",
            isNew: false,
            fields: defaultStudentFields()
          }
        ]
      },
      {
        id: "step-5-new-s2",
        explanation: "Another 'new Student()' creates a completely separate object in the Heap. Memory allocation is distinct for every 'new' keyword.",
        code: codeString,
        activeLine: 4,
        stackFrames: [
          {
            id: "frame-main",
            methodName: "main(String[] args)",
            isActive: true,
            variables: [
              { id: "v_args", name: "args", type: "String[]", value: "[]", isReference: true, refId: "@args_array" },
              { id: "v_s1", name: "s1", type: "Student", value: "@1001", isReference: true, refId: "@1001" }
            ]
          }
        ],
        consoleOutput: [],
        heapObjects: [
          { id: "@1001", className: "Student", fields: defaultStudentFields() },
          { id: "@1002", className: "Student", isNew: true, fields: defaultStudentFields() }
        ]
      },
      {
        id: "step-6-assign-s2",
        explanation: "The variable 's2' is added to the Stack, pointing to the second Student object.",
        code: codeString,
        activeLine: 4,
        stackFrames: [
          {
            id: "frame-main",
            methodName: "main(String[] args)",
            isActive: true,
            variables: [
              { id: "v_args", name: "args", type: "String[]", value: "[]", isReference: true, refId: "@args_array" },
              { id: "v_s1", name: "s1", type: "Student", value: "@1001", isReference: true, refId: "@1001" },
              { id: "v_s2", name: "s2", type: "Student", value: "@1002", isReference: true, refId: "@1002" }
            ]
          }
        ],
        consoleOutput: [],
        heapObjects: [
          { id: "@1001", className: "Student", fields: defaultStudentFields() },
          { id: "@1002", className: "Student", fields: defaultStudentFields() }
        ]
      },
      {
        id: "step-7-s1-name",
        explanation: "Using the 's1' reference, we modify the 'name' attribute of the first object in the Heap.",
        code: codeString,
        activeLine: 6,
        stackFrames: [
          {
            id: "frame-main",
            methodName: "main(String[] args)",
            isActive: true,
            variables: [
              { id: "v_args", name: "args", type: "String[]", value: "[]", isReference: true, refId: "@args_array" },
              { id: "v_s1", name: "s1", type: "Student", value: "@1001", isReference: true, refId: "@1001" },
              { id: "v_s2", name: "s2", type: "Student", value: "@1002", isReference: true, refId: "@1002" }
            ]
          }
        ],
        consoleOutput: [],
        heapObjects: [
          { id: "@1001", className: "Student", highlightedFieldId: "f_name", fields: [{ id: "f_name", name: "name", type: "String", value: '"Aditya"', isReference: true }, { id: "f_age", name: "age", type: "int", value: "0", isReference: false }, { id: "f_roll", name: "rollNumber", type: "int", value: "0", isReference: false }, { id: "f_college", name: "college", type: "String", value: "null", isReference: true }] },
          { id: "@1002", className: "Student", fields: defaultStudentFields() }
        ]
      },
      {
        id: "step-8-s1-age",
        explanation: "Next, we update the 'age' attribute. Notice how only object @1001 is affected.",
        code: codeString,
        activeLine: 7,
        stackFrames: [
          {
            id: "frame-main",
            methodName: "main(String[] args)",
            isActive: true,
            variables: [
              { id: "v_args", name: "args", type: "String[]", value: "[]", isReference: true, refId: "@args_array" },
              { id: "v_s1", name: "s1", type: "Student", value: "@1001", isReference: true, refId: "@1001" },
              { id: "v_s2", name: "s2", type: "Student", value: "@1002", isReference: true, refId: "@1002" }
            ]
          }
        ],
        consoleOutput: [],
        heapObjects: [
          { id: "@1001", className: "Student", highlightedFieldId: "f_age", fields: [{ id: "f_name", name: "name", type: "String", value: '"Aditya"', isReference: true }, { id: "f_age", name: "age", type: "int", value: "28", isReference: false }, { id: "f_roll", name: "rollNumber", type: "int", value: "0", isReference: false }, { id: "f_college", name: "college", type: "String", value: "null", isReference: true }] },
          { id: "@1002", className: "Student", fields: defaultStudentFields() }
        ]
      },
      {
        id: "step-9-s1-roll",
        explanation: "Updating the 'rollNumber'. Primitives are stored directly within the object in the Heap.",
        code: codeString,
        activeLine: 8,
        stackFrames: [
          {
            id: "frame-main",
            methodName: "main(String[] args)",
            isActive: true,
            variables: [
              { id: "v_args", name: "args", type: "String[]", value: "[]", isReference: true, refId: "@args_array" },
              { id: "v_s1", name: "s1", type: "Student", value: "@1001", isReference: true, refId: "@1001" },
              { id: "v_s2", name: "s2", type: "Student", value: "@1002", isReference: true, refId: "@1002" }
            ]
          }
        ],
        consoleOutput: [],
        heapObjects: [
          { id: "@1001", className: "Student", highlightedFieldId: "f_roll", fields: [{ id: "f_name", name: "name", type: "String", value: '"Aditya"', isReference: true }, { id: "f_age", name: "age", type: "int", value: "28", isReference: false }, { id: "f_roll", name: "rollNumber", type: "int", value: "101", isReference: false }, { id: "f_college", name: "college", type: "String", value: "null", isReference: true }] },
          { id: "@1002", className: "Student", fields: defaultStudentFields() }
        ]
      },
      {
        id: "step-10-s1-college",
        explanation: "Setting 'college' to 'IIT Guwahati'. This completes the data initialization for our first object.",
        code: codeString,
        activeLine: 9,
        stackFrames: [
          {
            id: "frame-main",
            methodName: "main(String[] args)",
            isActive: true,
            variables: [
              { id: "v_args", name: "args", type: "String[]", value: "[]", isReference: true, refId: "@args_array" },
              { id: "v_s1", name: "s1", type: "Student", value: "@1001", isReference: true, refId: "@1001" },
              { id: "v_s2", name: "s2", type: "Student", value: "@1002", isReference: true, refId: "@1002" }
            ]
          }
        ],
        consoleOutput: [],
        heapObjects: [
          { id: "@1001", className: "Student", highlightedFieldId: "f_college", fields: [{ id: "f_name", name: "name", type: "String", value: '"Aditya"', isReference: true }, { id: "f_age", name: "age", type: "int", value: "28", isReference: false }, { id: "f_roll", name: "rollNumber", type: "int", value: "101", isReference: false }, { id: "f_college", name: "college", type: "String", value: '"IIT Guwahati"', isReference: true }] },
          { id: "@1002", className: "Student", fields: defaultStudentFields() }
        ]
      },
      {
        id: "step-11-s2-name",
        explanation: "Now we begin populating the second object using the 's2' reference.",
        code: codeString,
        activeLine: 11,
        stackFrames: [
          {
            id: "frame-main",
            methodName: "main(String[] args)",
            isActive: true,
            variables: [
              { id: "v_args", name: "args", type: "String[]", value: "[]", isReference: true, refId: "@args_array" },
              { id: "v_s1", name: "s1", type: "Student", value: "@1001", isReference: true, refId: "@1001" },
              { id: "v_s2", name: "s2", type: "Student", value: "@1002", isReference: true, refId: "@1002" }
            ]
          }
        ],
        consoleOutput: [],
        heapObjects: [
          { id: "@1001", className: "Student", fields: [{ id: "f_name", name: "name", type: "String", value: '"Aditya"', isReference: true }, { id: "f_age", name: "age", type: "int", value: "28", isReference: false }, { id: "f_roll", name: "rollNumber", type: "int", value: "101", isReference: false }, { id: "f_college", name: "college", type: "String", value: '"IIT Guwahati"', isReference: true }] },
          { id: "@1002", className: "Student", highlightedFieldId: "f_name", fields: [{ id: "f_name", name: "name", type: "String", value: '"Rohit"', isReference: true }, { id: "f_age", name: "age", type: "int", value: "0", isReference: false }, { id: "f_roll", name: "rollNumber", type: "int", value: "0", isReference: false }, { id: "f_college", name: "college", type: "String", value: "null", isReference: true }] }
        ]
      },
      {
        id: "step-12-s2-rest",
        explanation: "We assign the rest of the properties for 's2'. Both objects now maintain their own distinct state in memory.",
        code: codeString,
        activeLine: 14,
        stackFrames: [
          {
            id: "frame-main",
            methodName: "main(String[] args)",
            isActive: true,
            variables: [
              { id: "v_args", name: "args", type: "String[]", value: "[]", isReference: true, refId: "@args_array" },
              { id: "v_s1", name: "s1", type: "Student", value: "@1001", isReference: true, refId: "@1001" },
              { id: "v_s2", name: "s2", type: "Student", value: "@1002", isReference: true, refId: "@1002" }
            ]
          }
        ],
        consoleOutput: [],
        heapObjects: [
          { id: "@1001", className: "Student", fields: [{ id: "f_name", name: "name", type: "String", value: '"Aditya"', isReference: true }, { id: "f_age", name: "age", type: "int", value: "28", isReference: false }, { id: "f_roll", name: "rollNumber", type: "int", value: "101", isReference: false }, { id: "f_college", name: "college", type: "String", value: '"IIT Guwahati"', isReference: true }] },
          { id: "@1002", className: "Student", highlightedFieldId: "f_college", fields: [{ id: "f_name", name: "name", type: "String", value: '"Rohit"', isReference: true }, { id: "f_age", name: "age", type: "int", value: "28", isReference: false }, { id: "f_roll", name: "rollNumber", type: "int", value: "102", isReference: false }, { id: "f_college", name: "college", type: "String", value: '"IIT Guwahati"', isReference: true }] }
        ]
      },
      {
        id: "step-13-s1-mark",
        explanation: "Method invocation: 's1.markAttendance()'. A new frame is pushed to the Call Stack. Crucially, the hidden 'this' reference is passed, pointing to the object that invoked the method (@1001).",
        code: codeString,
        activeLine: 16,
        stackFrames: [
          {
            id: "frame-mark-1",
            methodName: "markAttendance()",
            isActive: true,
            variables: [
              { id: "v_this", name: "this", type: "Student", value: "@1001", isReference: true, refId: "@1001" }
            ]
          },
          {
            id: "frame-main",
            methodName: "main(String[] args)",
            isActive: false,
            variables: [
              { id: "v_args", name: "args", type: "String[]", value: "[]", isReference: true, refId: "@args_array" },
              { id: "v_s1", name: "s1", type: "Student", value: "@1001", isReference: true, refId: "@1001" },
              { id: "v_s2", name: "s2", type: "Student", value: "@1002", isReference: true, refId: "@1002" }
            ]
          }
        ],
        consoleOutput: [],
        heapObjects: [
          { id: "@1001", className: "Student", fields: [{ id: "f_name", name: "name", type: "String", value: '"Aditya"', isReference: true }, { id: "f_age", name: "age", type: "int", value: "28", isReference: false }, { id: "f_roll", name: "rollNumber", type: "int", value: "101", isReference: false }, { id: "f_college", name: "college", type: "String", value: '"IIT Guwahati"', isReference: true }] },
          { id: "@1002", className: "Student", fields: [{ id: "f_name", name: "name", type: "String", value: '"Rohit"', isReference: true }, { id: "f_age", name: "age", type: "int", value: "28", isReference: false }, { id: "f_roll", name: "rollNumber", type: "int", value: "102", isReference: false }, { id: "f_college", name: "college", type: "String", value: '"IIT Guwahati"', isReference: true }] }
        ]
      },
      {
        id: "step-14-s1-mark-inner",
        explanation: "Inside the method, 'name' is resolved by looking at the object 'this' points to (@1001), and the print statement executes.",
        code: codeString,
        activeLine: 31,
        stackFrames: [
          {
            id: "frame-mark-1",
            methodName: "markAttendance()",
            isActive: true,
            variables: [
              { id: "v_this", name: "this", type: "Student", value: "@1001", isReference: true, refId: "@1001" }
            ]
          },
          {
            id: "frame-main",
            methodName: "main(String[] args)",
            isActive: false,
            variables: [
              { id: "v_args", name: "args", type: "String[]", value: "[]", isReference: true, refId: "@args_array" },
              { id: "v_s1", name: "s1", type: "Student", value: "@1001", isReference: true, refId: "@1001" },
              { id: "v_s2", name: "s2", type: "Student", value: "@1002", isReference: true, refId: "@1002" }
            ]
          }
        ],
        consoleOutput: [
          "Attendance marked by Aditya"
        ],
        heapObjects: [
          { id: "@1001", className: "Student", highlightedFieldId: "f_name", fields: [{ id: "f_name", name: "name", type: "String", value: '"Aditya"', isReference: true }, { id: "f_age", name: "age", type: "int", value: "28", isReference: false }, { id: "f_roll", name: "rollNumber", type: "int", value: "101", isReference: false }, { id: "f_college", name: "college", type: "String", value: '"IIT Guwahati"', isReference: true }] },
          { id: "@1002", className: "Student", fields: [{ id: "f_name", name: "name", type: "String", value: '"Rohit"', isReference: true }, { id: "f_age", name: "age", type: "int", value: "28", isReference: false }, { id: "f_roll", name: "rollNumber", type: "int", value: "102", isReference: false }, { id: "f_college", name: "college", type: "String", value: '"IIT Guwahati"', isReference: true }] }
        ]
      },
      {
        id: "step-15-s2-mark",
        explanation: "Now 's2.markAttendance()' is invoked. A new frame is pushed, but this time, the 'this' reference points to @1002.",
        code: codeString,
        activeLine: 17,
        stackFrames: [
          {
            id: "frame-mark-2",
            methodName: "markAttendance()",
            isActive: true,
            variables: [
              { id: "v_this", name: "this", type: "Student", value: "@1002", isReference: true, refId: "@1002" }
            ]
          },
          {
            id: "frame-main",
            methodName: "main(String[] args)",
            isActive: false,
            variables: [
              { id: "v_args", name: "args", type: "String[]", value: "[]", isReference: true, refId: "@args_array" },
              { id: "v_s1", name: "s1", type: "Student", value: "@1001", isReference: true, refId: "@1001" },
              { id: "v_s2", name: "s2", type: "Student", value: "@1002", isReference: true, refId: "@1002" }
            ]
          }
        ],
        consoleOutput: [
          "Attendance marked by Aditya"
        ],
        heapObjects: [
          { id: "@1001", className: "Student", fields: [{ id: "f_name", name: "name", type: "String", value: '"Aditya"', isReference: true }, { id: "f_age", name: "age", type: "int", value: "28", isReference: false }, { id: "f_roll", name: "rollNumber", type: "int", value: "101", isReference: false }, { id: "f_college", name: "college", type: "String", value: '"IIT Guwahati"', isReference: true }] },
          { id: "@1002", className: "Student", fields: [{ id: "f_name", name: "name", type: "String", value: '"Rohit"', isReference: true }, { id: "f_age", name: "age", type: "int", value: "28", isReference: false }, { id: "f_roll", name: "rollNumber", type: "int", value: "102", isReference: false }, { id: "f_college", name: "college", type: "String", value: '"IIT Guwahati"', isReference: true }] }
        ]
      },
      {
        id: "step-16-s1-print",
        explanation: "Calling 'print' on 's1' pushes a frame where 'this' refers to @1001. The second attendance has also been logged.",
        code: codeString,
        activeLine: 19,
        stackFrames: [
          {
            id: "frame-print-1",
            methodName: "print()",
            isActive: true,
            variables: [
              { id: "v_this", name: "this", type: "Student", value: "@1001", isReference: true, refId: "@1001" }
            ]
          },
          {
            id: "frame-main",
            methodName: "main(String[] args)",
            isActive: false,
            variables: [
              { id: "v_args", name: "args", type: "String[]", value: "[]", isReference: true, refId: "@args_array" },
              { id: "v_s1", name: "s1", type: "Student", value: "@1001", isReference: true, refId: "@1001" },
              { id: "v_s2", name: "s2", type: "Student", value: "@1002", isReference: true, refId: "@1002" }
            ]
          }
        ],
        consoleOutput: [
          "Attendance marked by Aditya",
          "Attendance marked by Rohit"
        ],
        heapObjects: [
          { id: "@1001", className: "Student", fields: [{ id: "f_name", name: "name", type: "String", value: '"Aditya"', isReference: true }, { id: "f_age", name: "age", type: "int", value: "28", isReference: false }, { id: "f_roll", name: "rollNumber", type: "int", value: "101", isReference: false }, { id: "f_college", name: "college", type: "String", value: '"IIT Guwahati"', isReference: true }] },
          { id: "@1002", className: "Student", fields: [{ id: "f_name", name: "name", type: "String", value: '"Rohit"', isReference: true }, { id: "f_age", name: "age", type: "int", value: "28", isReference: false }, { id: "f_roll", name: "rollNumber", type: "int", value: "102", isReference: false }, { id: "f_college", name: "college", type: "String", value: '"IIT Guwahati"', isReference: true }] }
        ]
      },
      {
        id: "step-17-s2-print",
        explanation: "Calling 'print' on 's2' pushes its frame. Aditya's details are printed.",
        code: codeString,
        activeLine: 20,
        stackFrames: [
          {
            id: "frame-print-2",
            methodName: "print()",
            isActive: true,
            variables: [
              { id: "v_this", name: "this", type: "Student", value: "@1002", isReference: true, refId: "@1002" }
            ]
          },
          {
            id: "frame-main",
            methodName: "main(String[] args)",
            isActive: false,
            variables: [
              { id: "v_args", name: "args", type: "String[]", value: "[]", isReference: true, refId: "@args_array" },
              { id: "v_s1", name: "s1", type: "Student", value: "@1001", isReference: true, refId: "@1001" },
              { id: "v_s2", name: "s2", type: "Student", value: "@1002", isReference: true, refId: "@1002" }
            ]
          }
        ],
        consoleOutput: [
          "Attendance marked by Aditya",
          "Attendance marked by Rohit",
          "Aditya , 28 , 101 , IIT Guwahati"
        ],
        heapObjects: [
          { id: "@1001", className: "Student", fields: [{ id: "f_name", name: "name", type: "String", value: '"Aditya"', isReference: true }, { id: "f_age", name: "age", type: "int", value: "28", isReference: false }, { id: "f_roll", name: "rollNumber", type: "int", value: "101", isReference: false }, { id: "f_college", name: "college", type: "String", value: '"IIT Guwahati"', isReference: true }] },
          { id: "@1002", className: "Student", fields: [{ id: "f_name", name: "name", type: "String", value: '"Rohit"', isReference: true }, { id: "f_age", name: "age", type: "int", value: "28", isReference: false }, { id: "f_roll", name: "rollNumber", type: "int", value: "102", isReference: false }, { id: "f_college", name: "college", type: "String", value: '"IIT Guwahati"', isReference: true }] }
        ]
      },
      {
        id: "step-18-end",
        explanation: "The main method finishes execution. The Call Stack is unwound, and since there are no remaining references to the objects in the Heap, they become eligible for Garbage Collection.",
        code: codeString,
        activeLine: 21,
        stackFrames: [],
        consoleOutput: [
          "Attendance marked by Aditya",
          "Attendance marked by Rohit",
          "Aditya , 28 , 101 , IIT Guwahati",
          "Rohit , 28 , 102 , IIT Guwahati"
        ],
        heapObjects: [
          { id: "@1001", className: "Student", fields: [{ id: "f_name", name: "name", type: "String", value: '"Aditya"', isReference: true }, { id: "f_age", name: "age", type: "int", value: "28", isReference: false }, { id: "f_roll", name: "rollNumber", type: "int", value: "101", isReference: false }, { id: "f_college", name: "college", type: "String", value: '"IIT Guwahati"', isReference: true }] },
          { id: "@1002", className: "Student", fields: [{ id: "f_name", name: "name", type: "String", value: '"Rohit"', isReference: true }, { id: "f_age", name: "age", type: "int", value: "28", isReference: false }, { id: "f_roll", name: "rollNumber", type: "int", value: "102", isReference: false }, { id: "f_college", name: "college", type: "String", value: '"IIT Guwahati"', isReference: true }] }
        ]
      }
    ]
  },
  constructorScenario
];
