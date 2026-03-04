# Complete Application Workflow Diagram

## 1. High-Level User Journey

```mermaid
graph TD
    User([User]) -->|Visit App| Landing[Landing Page]
    Landing -->|Action| Auth{Authenticated?}
    
    Auth -- No --> Login[Login / Register]
    Auth -- Yes --> Role{Role Check}
    
    Login -->|Success| Role
    
    Role -- Student --> StudentDash[Student Dashboard]
    Role -- Admin --> AdminDash[Admin Dashboard]
    
    subgraph Student Workflows
    StudentDash -->|Learn| Modules[View Modules]
    StudentDash -->|Compete| Contests[View Contests]
    StudentDash -->|Track| Profile[View Profile/Stats]
    
    Modules --> Quiz[Take Quiz]
    Quiz --> SubmitQuiz[Submit & Get Result]
    SubmitQuiz -->|Update XP| Profile
    
    Contests --> JoinContest[Join Contest]
    JoinContest --> SolveContest[Solve Questions]
    SolveContest --> SubmitContest[Submit Solution]
    SubmitContest --> Leaderboard[View Leaderboard]
    end
    
    subgraph Admin Workflows
    AdminDash --> ManageMod[Manage Modules]
    AdminDash --> ManageQ[Manage Questions]
    AdminDash --> ManageCon[Manage Contests]
    
    ManageMod --> CreateMod[Create Module]
    ManageMod --> UploadPDF[Upload PDF to Generate]
    UploadPDF -->|Parse & Gen| AutoCheck[Review Generated Content]
    
    ManageCon --> CreateCon[Create Contest]
    end
```

## 2. Detailed Authentication & Authorization Flow

```mermaid
sequenceDiagram
    participant User
    participant Client as Frontend (Web/Mobile)
    participant API as Backend API
    participant DB as MongoDB

    User->>Client: Enter Credentials
    Client->>API: POST /api/auth/login
    API->>DB: Find User
    DB-->>API: Return User Doc (Hashed Password)
    API->>API: Bcrypt Verify Password
    
    alt Invalid
        API-->>Client: 401 Unauthorized
        Client-->>User: Show Error
    else Valid
        API->>API: Generate JWT Token
        API-->>Client: Return Token & User Info
        Client->>Client: Store Token (LocalStorage/SecureStore)
        Client-->>User: Redirect to Dashboard
    end
```

## 3. PDF-to-Module Generation Workflow (Admin)

```mermaid
flowchart LR
    Admin([Admin]) -->|Upload PDF| Client[Frontend]
    Client -->|POST /admin/pdf/generate-module| API[Backend API]
    
    subgraph Backend Process
    API -->|Read File| PDFMiner[PDFMiner.six]
    PDFMiner -->|Extract Text| RawText[Raw Text Data]
    RawText -->|Process| GenEngine[Content Gen Engine]
    GenEngine -->|Create| NewModule[New Module Object]
    GenEngine -->|Generate| NewQuestions[Quiz Questions]
    end
    
    NewQuestions -->|Save| DB[(Database)]
    DB -->|Confirm| API
    API -->|Success| Client
    Client -->|Show| Admin
```

## 4. Contest Participation Workflow

```mermaid
stateDiagram-v2
    [*] --> BrowseContests
    BrowseContests --> Join: Click Join
    Join --> Active: Enter Contest Environment
    
    state Active {
        [*] --> ViewQuestion
        ViewQuestion --> SelectAnswer
        SelectAnswer --> NextQuestion
        NextQuestion --> ViewQuestion
        NextQuestion --> Review
    }
    
    Active --> Submit: Finish All / Timeout
    Submit --> CalScore: Backend Calculation
    CalScore --> UpdateLeaderboard: Save Score & Rank
    UpdateLeaderboard --> Results: Show Performance
    Results --> [*]
```
