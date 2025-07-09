# SoC-Data

This web app can scrape HackClub's Summer of Code website and gather every single project along with every user who has created at least one project.

The projects are stored in a PostgreSQL database. The entire list of projects is sent to the frontend which then does the required processing (sorting, filtering, etc.).

## Installation

Clone the repo:

```bash
git clone https://github.com/BirdRoad1/summerofcode-data.git
```

Install yarn if necessary:

```bash
npm i -g yarn
```

Install dependencies:

```bash
yarn install
```

Rename .env.sample to .env and adjust variables as needed

Start the web app:

```bash
yarn dev
```

## Use Case

### Fraud detection

This project allows you to see the users with the most hours and the projects with the most hours logged. Therefore, by checking the top ranked users, you can easily spot cases of fraud. For example, users with simple projects who log hundreds of hours are most likely faking their hours.

### Ranking

The more valuable Summer of Code prizes are limited in stock, so it may be useful to see how others are doing relative to you. With this project, you can see how you rank in the global leaderboard and exactly who the top rankers are and how many hours they have logged.

## Requirements

You will need a PostgreSQL database and Node.js 22 or higher.
