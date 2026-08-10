export const questions = [
  // --- JAVA QUESTIONS ---
  {
    language: "Java",
    category: "Coding",
    question: "Which keyword is used to inherit a class in Java?",
    options: ["extends", "implements", "inherits", "using"],
    answer: "extends"
  },
  {
    language: "Java",
    category: "Coding",
    question: "Which method is the entry point for any standard Java application?",
    options: ["public static void main(String[] args)", "public void main(String args)", "static main()", "void start()"],
    answer: "public static void main(String[] args)"
  },
  {
    language: "Java",
    category: "Technical",
    question: "Which component of Java enables 'Write Once, Run Anywhere' (WORA)?",
    options: ["JVM (Java Virtual Machine)", "JDK (Java Development Kit)", "JRE (Java Runtime Environment)", "JIT Compiler"],
    answer: "JVM (Java Virtual Machine)"
  },
  {
    language: "Java",
    category: "Coding",
    question: "Which collection class in Java implements a key-value pair map?",
    options: ["HashMap", "ArrayList", "LinkedList", "HashSet"],
    answer: "HashMap"
  },
  {
    language: "Java",
    category: "Coding",
    question: "Which keyword prevents a method from being overridden in Java?",
    options: ["final", "static", "abstract", "private"],
    answer: "final"
  },
  {
    language: "Java",
    category: "Technical",
    question: "Which exception is thrown in Java when accessing a method on a null object reference?",
    options: ["NullPointerException", "ArrayIndexOutOfBoundsException", "IllegalArgumentException", "ClassNotFoundException"],
    answer: "NullPointerException"
  },
  {
    language: "Java",
    category: "Coding",
    question: "Which interface must a class implement to allow object sorting via Collections.sort()?",
    options: ["Comparable", "Serializable", "Cloneable", "Runnable"],
    answer: "Comparable"
  },
  {
    language: "Java",
    category: "Technical",
    question: "Which keyword is used to instantiate an object in Java?",
    options: ["new", "alloc", "create", "instance"],
    answer: "new"
  },

  // --- PYTHON QUESTIONS ---
  {
    language: "Python",
    category: "Coding",
    question: "Which keyword is used to define a function in Python?",
    options: ["def", "func", "function", "lambda"],
    answer: "def"
  },
  {
    language: "Python",
    category: "Technical",
    question: "Which built-in Python data type is immutable?",
    options: ["Tuple", "List", "Dictionary", "Set"],
    answer: "Tuple"
  },
  {
    language: "Python",
    category: "Coding",
    question: "Which method adds a single element to the end of a Python list?",
    options: [".append()", ".extend()", ".insert()", ".push()"],
    answer: ".append()"
  },
  {
    language: "Python",
    category: "Coding",
    question: "Which block is used for exception handling in Python?",
    options: ["try...except", "try...catch", "do...catch", "try...handle"],
    answer: "try...except"
  },
  {
    language: "Python",
    category: "Technical",
    question: "What does the len() function return in Python?",
    options: ["Number of items in an object", "Memory address", "Data type of variable", "Byte size"],
    answer: "Number of items in an object"
  },
  {
    language: "Python",
    category: "Coding",
    question: "Which operator is used for integer floor division in Python?",
    options: ["//", "/", "%", "**"],
    answer: "//"
  },
  {
    language: "Python",
    category: "Technical",
    question: "Which symbol is used for single-line comments in Python?",
    options: ["#", "//", "<!-- -->", "/*"],
    answer: "#"
  },
  {
    language: "Python",
    category: "Coding",
    question: "Which keyword is used to import a module in Python?",
    options: ["import", "require", "include", "using"],
    answer: "import"
  },

  // --- C PROGRAMMING QUESTIONS ---
  {
    language: "C",
    category: "Coding",
    question: "Which standard header file is required for printf() and scanf() in C?",
    options: ["<stdio.h>", "<conio.h>", "<stdlib.h>", "<math.h>"],
    answer: "<stdio.h>"
  },
  {
    language: "C",
    category: "Coding",
    question: "Which operator is used to get the memory address of a variable in C?",
    options: ["&", "*", "->", "%"],
    answer: "&"
  },
  {
    language: "C",
    category: "Technical",
    question: "What is the correct format specifier for printing a signed integer in C?",
    options: ["%d", "%f", "%c", "%s"],
    answer: "%d"
  },
  {
    language: "C",
    category: "Technical",
    question: "Which function is used for dynamic memory allocation in C?",
    options: ["malloc()", "alloc()", "new()", "create()"],
    answer: "malloc()"
  },
  {
    language: "C",
    category: "Technical",
    question: "What is the typical size of an 'int' data type on modern 32-bit/64-bit systems in C?",
    options: ["4 bytes", "2 bytes", "8 bytes", "1 byte"],
    answer: "4 bytes"
  },
  {
    language: "C",
    category: "Coding",
    question: "Which statement exits early from a loop or switch case in C?",
    options: ["break", "exit", "continue", "stop"],
    answer: "break"
  },
  {
    language: "C",
    category: "Technical",
    question: "What value does the main() function return in C to indicate successful execution?",
    options: ["0", "1", "-1", "null"],
    answer: "0"
  },
  {
    language: "C",
    category: "Coding",
    question: "Which operator dereferences a pointer to access the value stored at that address in C?",
    options: ["*", "&", "->", "."],
    answer: "*"
  },

  // --- GENERAL APTITUDE QUESTIONS ---
  {
    language: "General",
    category: "Aptitude",
    question: "What is 15 × 12?",
    options: ["150", "170", "180", "200"],
    answer: "180"
  },
  {
    language: "General",
    category: "Aptitude",
    question: "25% of 200 is?",
    options: ["25", "40", "50", "75"],
    answer: "50"
  },
  {
    language: "General",
    category: "Aptitude",
    question: "If a train travels 60 km in 1 hour, how far will it travel in 5 hours?",
    options: ["240 km", "300 km", "360 km", "400 km"],
    answer: "300 km"
  },
  {
    language: "General",
    category: "Aptitude",
    question: "The average of 10, 20 and 30 is?",
    options: ["15", "20", "25", "30"],
    answer: "20"
  },
  {
    language: "General",
    category: "Aptitude",
    question: "What is the square root of 144?",
    options: ["10", "11", "12", "13"],
    answer: "12"
  },
  {
    language: "General",
    category: "Aptitude",
    question: "What is 18 × 5?",
    options: ["80", "85", "90", "95"],
    answer: "90"
  },
  {
    language: "General",
    category: "Aptitude",
    question: "40% of 250 is?",
    options: ["80", "90", "100", "110"],
    answer: "100"
  },
  {
    language: "General",
    category: "Aptitude",
    question: "A shopkeeper gives 10% discount on ₹500. Final price?",
    options: ["₹400", "₹450", "₹475", "₹500"],
    answer: "₹450"
  },

  // --- GENERAL COMMUNICATION QUESTIONS ---
  {
    language: "General",
    category: "Communication",
    question: "Which greeting is best for a professional email?",
    options: ["Hey", "Hi Dude", "Dear Sir/Madam", "Yo"],
    answer: "Dear Sir/Madam"
  },
  {
    language: "General",
    category: "Communication",
    question: "Good communication means?",
    options: ["Listening carefully", "Talking loudly", "Interrupting", "Ignoring"],
    answer: "Listening carefully"
  },
  {
    language: "General",
    category: "Communication",
    question: "Choose the professional email closing.",
    options: ["Bye", "Thanks & Regards", "See ya", "Later"],
    answer: "Thanks & Regards"
  },
  {
    language: "General",
    category: "Communication",
    question: "What is the most important skill in teamwork?",
    options: ["Listening", "Arguing", "Ignoring others", "Working alone"],
    answer: "Listening"
  },
  {
    language: "General",
    category: "Communication",
    question: "Which sentence is professional?",
    options: ["Send it ASAP.", "Kindly send the report by 5 PM.", "Hurry up!", "Do it now."],
    answer: "Kindly send the report by 5 PM."
  }
];