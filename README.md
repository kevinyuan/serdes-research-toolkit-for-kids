# SerDes Research Toolkit for Kids

An interactive, educational web application designed to teach the fundamentals of SerDes (Serializer/Deserializer) technology to students and beginners.

## Overview

This toolkit provides a visual and interactive simulation of a high-speed communication link. Users can explore various components of the SerDes pipeline, visualize signals, and understand how data is transmitted and recovered.

## Features

*   **Interactive Pipeline:** Visualize the entire SerDes chain from Transmitter (TX) to Receiver (RX).
*   **Component Simulation:** Explore individual blocks like PRBS Generator, TX Equalizer (FFE), Channel, RX Equalizer (CTLE), DFE, and Slicer.
*   **Real-time Visualization:** See how signals change as they pass through different stages (Time Domain, Eye Diagram).
*   **Educational Content:** Learn about signal integrity concepts like ISI (Inter-Symbol Interference), jitter, and noise.
*   **Bit Error Rate (BER) Analysis:** Understand how signal quality affects data recovery.

## Getting Started

### Prerequisites

*   Node.js (v18 or higher)
*   npm (v9 or higher)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/kevinyuan/serdes-toolkit-for-kids.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd serdes-toolkit-for-kids
    ```
3.  Install dependencies:
    ```bash
    npm install
    ```

### Running the Application

Start the development server:

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173` (or the port shown in your terminal).

## Technologies Used

*   **Frontend:** React, TypeScript, Vite
*   **Styling:** Tailwind CSS
*   **Visualization:** Recharts
*   **Icons:** Lucide React (or custom SVGs)

## License

This project is licensed under the MIT License.

## Acknowledgments

Designed for educational purposes to make complex engineering concepts accessible to everyone.
