export interface SampleNotice {
  id: string;
  name: string;
  description: string;
  text: string;
}

export interface SampleNotes {
  id: string;
  name: string;
  subject: string;
  scope: string;
  text: string;
}

export const SAMPLE_NOTICES: SampleNotice[] = [
  {
    id: "cs-exam-notice",
    name: "Internal Assessment Notice (Official Test A)",
    description: "Computer Networks internal assessment schedule and requirements",
    text: `Computer Science Department
Internal Assessment Notice

The Computer Networks examination will be held on 15 November 2026 at 10:00 AM.
Students must register by 5 November 2026.
Students must bring their college ID card.
All enrolled students are eligible.
Venue: Examination Hall 3, Block B.
Late submissions of registration forms will incur a penalty of Rs. 200.`,
  },
  {
    id: "scholarship-notice",
    name: "Merit-cum-Means Scholarship Circular",
    description: "Eligibility criteria, deadline, and mandatory documents",
    text: `Dean of Student Affairs
Notice No: DSA/SCH/2026/89

Applications are invited from 2nd and 3rd year undergraduate engineering students for the Merit-cum-Means Scholarship 2026-27.
The deadline for online portal submission is 10 December 2026 by 5:00 PM. Hard copies must reach the DSA office by 14 December 2026.

Eligibility:
- Minimum cumulative CGPA of 7.5 with no standing backlogs.
- Annual family income must be below Rs. 4,50,000.

Required Documents:
1. Income certificate issued by a competent revenue officer (Tahshildar or equivalent).
2. Semester 1 to Semester 4 grade cards.
3. College ID card copy.
4. Active nationalized bank passbook front page with IFSC code.

Important: Incomplete applications or submissions with illegible documents will be rejected without prior notice.`,
  },
  {
    id: "internship-placement-notice",
    name: "Campus Placement & Internship Drive",
    description: "Cloud & AI developer intern recruitment drive",
    text: `Training and Placement Cell
Urgent Notice: Apex Software Solutions Placement Drive

Apex Software Solutions will conduct an on-campus placement and summer internship drive on 28 November 2026 at 9:00 AM.
Pre-placement talk begins at 9:30 AM in the Main Auditorium followed by an online coding test at 11:30 AM.

Registration deadline: 20 November 2026, 11:59 PM via the college placement portal.

Eligibility:
- B.Tech / B.E in CS, IT, and Electronics.
- 65% or 6.5 CGPA throughout 10th, 12th, and UG.
- Max 1 active backlog permitted.

Mandatory Checklist:
- 2 updated hard copies of resume.
- 2 passport size photographs.
- College ID and Govt Photo ID (Aadhaar or Driving License).
- Formal attire mandatory.`,
  },
];

export const SAMPLE_NOTES: SampleNotes[] = [
  {
    id: "cn-module-1",
    name: "Computer Networks — Module 1 (Official Test B)",
    subject: "Computer Networks",
    scope: "Module 1",
    text: `Computer Networks — Module 1

A computer network connects two or more devices to share data and resources.

A LAN (Local Area Network) covers a limited geographical area, such as an office or college building. It typically uses Ethernet or Wi-Fi with high data transfer rates and low latency.
A MAN (Metropolitan Area Network) covers a larger geographical area such as an entire city or campus interconnecting multiple LANs.
A WAN (Wide Area Network) covers a large geographical area and can connect networks across cities, countries, or globally. The Internet is the best-known example of a WAN.

Network Topologies:
Network topologies define the arrangement of elements in a communication network.
1. Star Topology: In a star topology, all devices connect directly to a central hub or switch. If one cable fails, only that device is disconnected; however, if the central hub fails, the entire network goes down.
2. Bus Topology: All nodes are connected to a single central cable called the backbone. It uses terminators at each end to absorb signals and prevent reflection. It is inexpensive to install but difficult to isolate faults.
3. Ring Topology: Each device is connected to two adjacent devices forming a circular loop. Data travels in one direction (unidirectional) using tokens. A single break can interrupt the entire ring unless dual-ring architecture is used.
4. Mesh Topology: Every device has a dedicated point-to-point link to every other device in full mesh. It provides maximum fault tolerance and privacy, but involves high cabling cost and complexity.

OSI Reference Model:
The Open Systems Interconnection model consists of 7 layers:
Layer 7: Application Layer (HTTP, FTP, DNS)
Layer 6: Presentation Layer (Encryption, compression)
Layer 5: Session Layer (Session management, checkpointing)
Layer 4: Transport Layer (End-to-end communication, TCP, UDP, port numbers)
Layer 3: Network Layer (Logical IP addressing, routing, routers)
Layer 2: Data Link Layer (Framing, MAC physical addressing, error detection, switches)
Layer 1: Physical Layer (Bits, cables, pinouts, voltages, hubs)`,
  },
  {
    id: "os-module-2",
    name: "Operating Systems — Process Management & CPU Scheduling",
    subject: "Operating Systems",
    scope: "Module 2",
    text: `Operating Systems — Module 2: Process Scheduling & Synchronization

A process is a program in execution. A process control block (PCB) contains the process state, program counter, CPU registers, CPU scheduling information, and memory management information.

Process States:
1. New: The process is being created.
2. Ready: The process is waiting to be assigned to a processor.
3. Running: Instructions are being executed.
4. Waiting (Blocked): The process is waiting for some event (such as I/O completion).
5. Terminated: The process has finished execution.

CPU Scheduling Algorithms:
1. First-Come, First-Served (FCFS): Non-preemptive algorithm where the process requesting CPU first gets allocated first. Suffers from the Convoy Effect, leading to high average waiting time.
2. Shortest Job First (SJF): Schedules the process with the smallest CPU burst time next. Proven to give the minimum average waiting time. Can be non-preemptive or preemptive (Shortest Remaining Time First - SRTF).
3. Round Robin (RR): Designed especially for time-sharing systems. Each process gets a small unit of CPU time (time quantum, typically 10 to 100 milliseconds). If time quantum is very large, RR behaves like FCFS. If time quantum is too small, excessive context switching overhead occurs.
4. Priority Scheduling: A priority number is associated with each process. A major problem is starvation (indefinite blocking of low-priority processes). Solution is aging (gradually increasing the priority of waiting processes).

Deadlock:
A deadlock is a situation where a set of processes are blocked because each process is holding a resource and waiting for another resource held by another process.
Four Coffman conditions necessary for deadlock:
1. Mutual Exclusion: At least one resource must be held in a non-shareable mode.
2. Hold and Wait: A process must be holding at least one resource and waiting to acquire additional resources.
3. No Preemption: Resources cannot be forcibly taken away from a process.
4. Circular Wait: A closed chain of processes exists such that each process holds a resource needed by the next.`,
  },
];
