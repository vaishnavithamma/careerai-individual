// Question Generation Service for CareerAI Voice Interview
// Supports 30+ roles with dynamic skill maps and question-specific evaluations

export class QuestionService {
  static ROLES = [
    "Software Engineer",
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "Java Developer",
    "Python Developer",
    "C++ Developer",
    "Android Developer",
    "iOS Developer",
    "Flutter Developer",
    "React Developer",
    "Node.js Developer",
    "DevOps Engineer",
    "Cloud Engineer",
    "Cybersecurity Analyst",
    "Network Engineer",
    "Data Analyst",
    "Data Engineer",
    "Data Scientist",
    "Machine Learning Engineer",
    "AI Engineer",
    "Generative AI Engineer",
    "Computer Vision Engineer",
    "NLP Engineer",
    "QA Engineer",
    "Automation Test Engineer",
    "Business Analyst",
    "Product Manager",
    "UI/UX Designer",
    "Embedded Systems Engineer",
    "Blockchain Developer"
  ];

  static ROLE_SKILLS_MAP = {
    "Software Engineer": ["Algorithms", "Data Structures", "OOP", "System Design", "Git"],
    "Frontend Developer": ["HTML", "CSS", "JavaScript", "React", "Web Performance"],
    "Backend Developer": ["Node.js", "Express", "APIs", "SQL", "System Design"],
    "Full Stack Developer": ["React", "Node.js", "SQL", "REST APIs", "JavaScript"],
    "Java Developer": ["Java", "OOP", "Spring Boot", "SQL", "Multithreading"],
    "Python Developer": ["Python", "Django", "Flask", "SQL", "APIs"],
    "C++ Developer": ["C++", "Memory Management", "Pointers", "OOP", "STL"],
    "Android Developer": ["Kotlin", "Java", "Android SDK", "Jetpack Compose", "APIs"],
    "iOS Developer": ["Swift", "UIKit", "SwiftUI", "Xcode", "APIs"],
    "Flutter Developer": ["Dart", "Flutter", "State Management", "Widget Tree", "APIs"],
    "React Developer": ["React", "Redux", "Hooks", "JavaScript", "Virtual DOM"],
    "Node.js Developer": ["Node.js", "Express", "Asynchronous Programming", "Event Loop", "APIs"],
    "DevOps Engineer": ["Docker", "Kubernetes", "CI/CD", "Linux", "AWS"],
    "Cloud Engineer": ["AWS", "Cloud Architecture", "Terraform", "Serverless", "Kubernetes"],
    "Cybersecurity Analyst": ["Network Security", "Cryptography", "OWASP", "Penetration Testing", "Threat Detection"],
    "Network Engineer": ["TCP/IP", "DNS", "Subnetting", "Routing & Switching", "Firewalls"],
    "Data Analyst": ["SQL", "Excel", "Tableau", "PowerBI", "Statistics"],
    "Data Engineer": ["Python", "Spark", "SQL", "ETL Pipelines", "Data Warehousing"],
    "Data Scientist": ["Python", "Statistics", "Machine Learning", "Pandas", "Data Visualization"],
    "Machine Learning Engineer": ["Python", "Scikit-Learn", "TensorFlow", "Feature Engineering", "Model Evaluation"],
    "AI Engineer": ["Python", "Neural Networks", "Deep Learning", "NLP", "TensorFlow"],
    "Generative AI Engineer": ["LLMs", "Prompt Engineering", "LangChain", "Vector Databases", "Python"],
    "Computer Vision Engineer": ["OpenCV", "PyTorch", "Image Processing", "CNNs", "Python"],
    "NLP Engineer": ["Transformers", "NLTK", "Tokenization", "Python", "BERT/GPT"],
    "QA Engineer": ["Manual Testing", "Test Cases", "Bug Tracking", "SDLC", "Agile"],
    "Automation Test Engineer": ["Selenium", "Java/Python", "TestNG", "API Testing", "CI/CD"],
    "Business Analyst": ["Requirements Gathering", "UML", "Agile", "SQL", "Data Analysis"],
    "Product Manager": ["Product Roadmap", "Market Research", "Agile/Scrum", "A/B Testing", "KPIs"],
    "UI/UX Designer": ["Figma", "Wireframing", "User Research", "Prototyping", "Design Systems"],
    "Embedded Systems Engineer": ["C/C++", "Microcontrollers", "RTOS", "I2C/SPI", "Firmware"],
    "Blockchain Developer": ["Solidity", "Smart Contracts", "Ethereum", "Cryptography", "Web3.js"]
  };

  static QUESTIONS_DB = {
    frontend: [
      {
        text: "Explain the Virtual DOM in React and how it improves performance.",
        level: "EASY",
        keywords: ["virtual dom", "diffing", "reconciliation", "performance"],
        idealAnswer: "The Virtual DOM is a lightweight memory representation of the real DOM. When state changes, React updates the Virtual DOM, performs a diffing algorithm against the previous snapshot, and applies only the batched differences to the real DOM (Reconciliation). This minimizes expensive direct DOM manipulations.",
        missingPoints: ["Reconciliation process", "Batching updates", "Diffing algorithm complexity"],
        improvementSuggestions: ["Explain why direct DOM manipulation is slow.", "Describe the lifecycle of updates.", "Mention batching."]
      },
      {
        text: "Explain the concept of closures in JavaScript and a real-world use case.",
        level: "MEDIUM",
        keywords: ["closure", "lexical environment", "scope", "state encapsulation"],
        idealAnswer: "A closure is the combination of a function bundled together with references to its surrounding state (the lexical environment). In simple terms, a closure gives an inner function access to the outer function's scope even after the outer function returns. A common use case is data privacy/encapsulation, such as creating private variables inside objects or counter modules.",
        missingPoints: ["Lexical environment", "Preserving outer scope variables", "Encapsulation / Private variables"],
        improvementSuggestions: ["Start with a clear definition.", "Give a quick code-like example verbally.", "Discuss memory/garbage collection considerations."]
      },
      {
        text: "How do you optimize web page performance and reduce page load times?",
        level: "ADVANCED",
        keywords: ["lazy loading", "code splitting", "bundling", "image optimization", "caching"],
        idealAnswer: "Web performance can be optimized in several ways: 1) Asset optimization (compressing images, minifying CSS/JS). 2) Code splitting and lazy loading of React components to reduce bundle size. 3) Utilizing CDNs and browser caching headers. 4) Minimizing render-blocking resources and critical path rendering.",
        missingPoints: ["Critical rendering path", "Code splitting / lazy loading", "CDN deployment advantages"],
        improvementSuggestions: ["Categorize your answer into Network, Asset, and Render optimizations.", "Mention metrics like First Contentful Paint (FCP)."]
      }
    ],
    backend: [
      {
        text: "What is the difference between REST APIs and GraphQL?",
        level: "EASY",
        keywords: ["rest", "graphql", "endpoints", "over-fetching", "single endpoint"],
        idealAnswer: "REST is architectural pattern where each resource has a specific URL/endpoint. GraphQL is a query language that allows clients to request exactly the data they need from a single endpoint, solving issues like over-fetching and under-fetching.",
        missingPoints: ["Over-fetching / Under-fetching solutions", "Single endpoint routing", "Multiple HTTP verbs usage in REST"],
        improvementSuggestions: ["Contrast the resource-centric view of REST with the graph schema of GraphQL.", "Mention caching implications."]
      },
      {
        text: "Explain how database indexing works and the trade-offs involved.",
        level: "MEDIUM",
        keywords: ["indexing", "b-tree", "lookup", "write overhead", "search performance"],
        idealAnswer: "Database indexing creates a separate data structure (typically a B-Tree) that stores references to table rows, enabling binary search lookups rather than full-table scans. The trade-off is that write operations (INSERT, UPDATE, DELETE) become slower because index pointers must be updated.",
        missingPoints: ["B-Tree structure", "Full-table scan comparison", "Write operation overheads"],
        improvementSuggestions: ["Specify the physical storage concept.", "Mention when not to index (e.g., small tables, high write frequency)."]
      },
      {
        text: "Explain what microservices are and how they communicate with each other.",
        level: "ADVANCED",
        keywords: ["microservices", "grpc", "message broker", "rest", "loose coupling"],
        idealAnswer: "Microservices split a monolithic application into small, independent, and loosely coupled services that govern separate domain contexts. They communicate synchronously using REST/HTTP or gRPC, or asynchronously using message brokers like RabbitMQ or Kafka.",
        missingPoints: ["Domain-driven design", "Message brokers (Kafka/RabbitMQ)", "Synchronous vs Asynchronous communications"],
        improvementSuggestions: ["Explain loose coupling.", "Briefly cover service discovery and API gateways."]
      }
    ],
    ai_ml: [
      {
        text: "Explain the difference between supervised and unsupervised learning.",
        level: "EASY",
        keywords: ["supervised", "unsupervised", "labeled data", "clustering", "classification"],
        idealAnswer: "Supervised learning trains models on labeled input-output datasets (e.g., classification, regression). Unsupervised learning models operate on unlabeled datasets, finding hidden patterns or clusters without external guidance (e.g., K-Means clustering, PCA).",
        missingPoints: ["Labeled vs Unlabeled data", "Target variables", "Common algorithms (Regression vs Clustering)"],
        improvementSuggestions: ["Contrast the training objectives clearly.", "Provide an example for both (e.g., housing price prediction vs customer segmentation)."]
      },
      {
        text: "What is feature engineering and why is it critical in model development?",
        level: "MEDIUM",
        keywords: ["feature engineering", "one-hot encoding", "imputation", "scaling", "missing values"],
        idealAnswer: "Feature engineering is the process of transforming raw data features into formats that improve model accuracy (e.g., one-hot encoding categorical variables, normalizing scale, or imputing missing data). It is critical because models are only as good as the representations provided to them.",
        missingPoints: ["One-hot encoding / Label encoding", "Standardization vs Normalization", "Imputation for missing entries"],
        improvementSuggestions: ["Discuss how feature scaling prevents bias in distance-based algorithms.", "Mention dimensionality reduction."]
      },
      {
        text: "Explain the concept of overfitting and how you prevent it in neural networks.",
        level: "ADVANCED",
        keywords: ["overfitting", "dropout", "regularization", "early stopping", "generalization"],
        idealAnswer: "Overfitting occurs when a neural network memorizes noise in the training dataset and fails to generalize to unseen test data. To prevent it, we use: 1) Dropout (randomly turning off neurons). 2) L1/L2 Regularization (penalizing large weights). 3) Early stopping based on validation loss. 4) Data augmentation.",
        missingPoints: ["Generalization error", "Dropout mechanism", "Early stopping boundaries"],
        improvementSuggestions: ["State the symptom: high training accuracy, low validation accuracy.", "Discuss regularization techniques clearly."]
      }
    ],
    generic: [
      {
        text: "Describe the object-oriented programming concepts and why they are useful.",
        level: "EASY",
        keywords: ["encapsulation", "inheritance", "polymorphism", "abstraction"],
        idealAnswer: "OOP relies on four pillars: 1) Abstraction (hiding complexity). 2) Encapsulation (binding data and methods). 3) Inheritance (reusing code). 4) Polymorphism (overriding/overloading methods). These principles keep code modular and readable.",
        missingPoints: ["Four OOP pillars", "Code reusability", "Encapsulation for security"],
        improvementSuggestions: ["List all four pillars.", "Define each pillar in one sentence.", "Give a brief example (e.g., a Vehicle class)."]
      },
      {
        text: "What is git and how do you resolve a merge conflict?",
        level: "MEDIUM",
        keywords: ["git", "merge conflict", "branches", "rebase", "conflict markers"],
        idealAnswer: "Git is a distributed version control system. A merge conflict happens when developers make competing changes to the same line of a file. To resolve it, we locate the conflict markers (<<<<<<<, =======, >>>>>>>), determine which changes to keep, edit the file, commit the changes, and complete the merge.",
        missingPoints: ["Conflict markers", "Competing commits", "Staging the resolution"],
        improvementSuggestions: ["Explain conflict markers.", "Outline the command steps: git status -> edit -> git add -> git commit."]
      },
      {
        text: "Explain what is CI/CD and how it benefits a software team.",
        level: "ADVANCED",
        keywords: ["ci/cd", "pipeline", "automated tests", "continuous deployment", "jenkins/actions"],
        idealAnswer: "CI/CD stands for Continuous Integration and Continuous Delivery/Deployment. It involves setting up automated pipelines that run code linting, unit tests, and integrations on every push, then automatically deploy build artifacts to server environments. This reduces human error and accelerates release cycles.",
        missingPoints: ["Automated testing suites", "Artifact deployment", "Feedback loops"],
        improvementSuggestions: ["Define CI and CD separately first.", "Explain the concept of build pipelines."]
      }
    ]
  };

  // Defensive request wrapper
  static async safeFetchJson(url, options = {}) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        console.warn(`HTTP error! status: ${response.status} on ${url}`);
        return { error: `HTTP_${response.status}` };
      }
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.warn(`Invalid content type: ${contentType} on ${url}`);
        return { error: "INVALID_CONTENT_TYPE" };
      }
      return await response.json();
    } catch (e) {
      console.warn(`Fetch failure on ${url}:`, e);
      return { error: "NETWORK_FAILURE" };
    }
  }

  // Schema normalizer to guarantee properties exist defensively
  static normalizeQuestion(q, fallbackCategory = "General") {
    if (!q || typeof q !== 'object') {
      return {
        text: "Please describe your core programming achievements.",
        level: "MEDIUM",
        difficulty: "MEDIUM",
        category: fallbackCategory,
        expectedAnswer: "Demonstrable technical logic and skillsets.",
        idealAnswer: "Demonstrable technical logic and skillsets.",
        keywords: ["programming", "skills"],
        missingPoints: [],
        improvementSuggestions: []
      };
    }

    const text = q.text || q.question || "Describe your background.";
    const level = q.level || q.difficulty || "MEDIUM";
    const expected = q.expectedAnswer || q.idealAnswer || "";
    
    return {
      text: text,
      level: level,
      difficulty: level,
      category: q.category || fallbackCategory,
      expectedAnswer: expected,
      idealAnswer: expected,
      keywords: Array.isArray(q.keywords) ? q.keywords : [],
      missingPoints: Array.isArray(q.missingPoints) ? q.missingPoints : [],
      improvementSuggestions: Array.isArray(q.improvementSuggestions) ? q.improvementSuggestions : []
    };
  }

  static async getTechnicalQuestions(profile, count = 5) {
    const data = await this.safeFetchJson("/api/generate-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selectedRole: profile?.selectedRole || "Software Engineer",
        skills: profile?.skills || [],
        count,
        difficulty: profile?.difficulty || "progressive",
        round: "technical"
      })
    });

    if (data && !data.error && Array.isArray(data)) {
      return data.map((q, idx) => {
        const norm = this.normalizeQuestion(q, "Technical");
        return { ...norm, index: idx + 1 };
      });
    }

    console.warn("LLM API unavailable or returned error. Falling back to local questions:", data);
    return this.getLocalTechnicalQuestions(profile, count);
  }

  static getLocalTechnicalQuestions(profile, count) {
    const selectedRole = profile?.selectedRole || "Software Engineer";
    const roleLower = selectedRole.toLowerCase();

    let category = "generic";
    if (roleLower.includes("front") || roleLower.includes("react") || roleLower.includes("ui") || roleLower.includes("design")) {
      category = "frontend";
    } else if (roleLower.includes("back") || roleLower.includes("node") || roleLower.includes("java") || roleLower.includes("database") || roleLower.includes("system") || roleLower.includes("blockchain")) {
      category = "backend";
    } else if (roleLower.includes("machine") || roleLower.includes("ai") || roleLower.includes("nlp") || roleLower.includes("vision") || roleLower.includes("data") || roleLower.includes("science")) {
      category = "ai_ml";
    }

    const primaryPool = this.QUESTIONS_DB[category] || this.QUESTIONS_DB["generic"];
    const genericPool = this.QUESTIONS_DB["generic"];
    const combinedPool = [...primaryPool, ...genericPool];

    const picked = [];
    const used = new Set();

    const addQuestion = (level) => {
      let matches = combinedPool.filter(q => q.level === level && !used.has(q.text));
      if (matches.length === 0) {
        matches = combinedPool.filter(q => !used.has(q.text));
      }
      if (matches.length > 0) {
        const selected = matches[Math.floor(Math.random() * matches.length)];
        picked.push(this.normalizeQuestion(selected, "Technical"));
        used.add(selected.text);
      }
    };

    addQuestion("EASY");
    addQuestion("EASY");
    addQuestion("MEDIUM");
    addQuestion("MEDIUM");
    addQuestion("ADVANCED");

    // Ensure we return the correct count
    while (picked.length < count) {
      const fallbackItem = combinedPool[Math.floor(Math.random() * combinedPool.length)];
      picked.push(this.normalizeQuestion(fallbackItem, "Technical"));
    }

    return picked.slice(0, count).map((q, idx) => ({ ...q, index: idx + 1 }));
  }

  static async getHrQuestions(count = 5) {
    const data = await this.safeFetchJson("/api/generate-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selectedRole: "General HR Candidate",
        skills: ["Soft Skills", "STAR storytelling"],
        count,
        difficulty: "medium",
        round: "hr"
      })
    });

    if (data && !data.error && Array.isArray(data)) {
      return data.map((q, idx) => {
        const norm = this.normalizeQuestion(q, "HR");
        return { ...norm, index: idx + 1 };
      });
    }

    console.warn("LLM API unavailable or returned error. Falling back to local HR questions:", data);
    return this.getLocalHrQuestions(count);
  }

  static getLocalHrQuestions(count) {
    const hrBank = [
      {
        text: "Tell me about yourself and your background.",
        level: "BEHAVIOURAL",
        keywords: ["education", "skills", "projects", "experience", "background"],
        idealAnswer: "I am a graduate with a degree in Computer Science, and I specialize in software development. Throughout college, I built several projects including an AI-powered portal and a system optimization tool. I am motivated to apply my technical knowledge and collaborative skills to build scalable solutions here.",
        missingPoints: ["Brief educational overview", "Key project/work highlights", "Your future goal/interest link to this company"],
        improvementSuggestions: ["Keep it structured: Past -> Present -> Future."]
      },
      {
        text: "Why should we hire you for this role?",
        level: "BEHAVIOURAL",
        keywords: ["value", "skills", "fit", "motivation", "problem solving"],
        idealAnswer: "You should hire me because I have a solid foundation in the required technologies and a proven track record of delivering projects successfully. More than just coding skills, I am an active listener and clear communicator who thrives in team environments. I bring a strong work ethic and continuous learning mindset that fits your company's culture.",
        missingPoints: ["Aligning your skills to the JD", "Cultural fit indicators", "Problem-solving examples"],
        improvementSuggestions: ["Focus on what value you will bring to the team rather than just what you want to learn."]
      },
      {
        text: "Describe a conflict you handled or a disagreement you had with a teammate.",
        level: "BEHAVIOURAL",
        keywords: ["conflict", "communication", "listen", "resolution", "empathy"],
        idealAnswer: "During a group project, a teammate and I disagreed on database schemas. Instead of arguing, I scheduled a brief call, actively listened to their concerns, and laid out the pros/cons of both approaches on a whiteboard. We compromisingly chose a hybrid model that satisfied both speed and structural needs, keeping the project on schedule.",
        missingPoints: ["STAR method structure", "Listening / Empathy demonstration", "Positive resolution outcomes"],
        improvementSuggestions: ["Ensure the conflict is described objectively. Spend 70% of the response explaining the compromise/solution."]
      },
      {
        text: "Tell me about a time you faced a failure or made a mistake, and what you learned.",
        level: "BEHAVIOURAL",
        keywords: ["failure", "mistake", "learned", "responsibility", "growth"],
        idealAnswer: "In a previous project, I pushed an unverified script that temporarily broke our development environment. I immediately took responsibility, worked with the senior engineer to revert it, and diagnosed the issue. Since then, I created a pre-commit check routine, ensuring no code is committed without local testing. This taught me the value of process guards and immediate ownership.",
        missingPoints: ["Ownership of error", "Steps to resolve", "Systemic improvement implemented"],
        improvementSuggestions: ["Do not blame others. Focus heavily on the Lessons Learned and prevention steps."]
      },
      {
        text: "Where do you see yourself in five years?",
        level: "BEHAVIOURAL",
        keywords: ["goals", "growth", "commitment", "future", "learning"],
        idealAnswer: "In five years, I see myself as a senior technical contributor or system lead, possessing deep expertise in engineering architectures. I plan to take on larger code ownership tasks and mentor junior engineers, while continuously contributing to the growth of this organization.",
        missingPoints: ["Professional skill growth goals", "Leadership/Mentorship targets", "Longevity signal with company"],
        improvementSuggestions: ["Balance technical skill acquisition with leadership/collaboration goals."]
      }
    ];

    const mapped = hrBank.map(q => this.normalizeQuestion(q, "HR"));
    
    while (mapped.length < count) {
      mapped.push(this.normalizeQuestion(null, "HR"));
    }

    return mapped.slice(0, count).map((q, idx) => ({ ...q, index: idx + 1 }));
  }

  static async getFollowUpQuestion(questionText, answerText, previousContext = []) {
    const data = await this.safeFetchJson("/api/generate-followup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionText, answerText, previousContext })
    });

    if (data && data.followUp) {
      return data.followUp.trim();
    }

    console.warn("LLM Follow-up unavailable, using fallback:", data);
    const followUps = [
      "Can you explain that aspect in a bit more detail?",
      "What alternative approach or solution would you consider?",
      "What happens if the input size becomes very large or constraints change?",
      "Why did you choose that specific solution or tool over others?",
      "Can you give a practical, real-world example of this concept?",
      "What is the biggest challenge or drawback of this method?"
    ];
    return followUps[Math.floor(Math.random() * followUps.length)];
  }
}
