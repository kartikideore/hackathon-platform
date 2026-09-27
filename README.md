# HackTrack
So basically, I built this thing because our college keeps sending hackathon 
links over WhatsApp and email, and half of them get lost. People from CSE 
never find out about the ECE fest, and ECE folks miss the coding events. 
Total mess.
So I made a small website where all the events are in one place and you can 
just pick your department and see what's happening.
 What it does
There are basically two sides to it:
For students-you open the site, pick your department from the dropdown, 
and you see a list of hackathons and events. Each one has a button that takes 
you straight to the registration page. No more scrolling through old messages.
For admins-the college admin can log in with a password, and then they 
can add new events or remove old ones. Just paste the name, pick the 
department, and paste the link. Done.
That's it. Simple.
 Live link
You can actually use it here:
https://hackathon-platform-3ggx.onrender.com
Fair warning-if nobody has opened it in the last 15 minutes, it takes 
around 30 seconds to wake up. That's a free tier thing, nothing I can do 
about it right now.
How I built it
I used Python on the backend because I'm more comfortable with it than 
Node. FastAPI was pretty nice to work with — it has automatic docs at 
`/docs` which saved me a lot of time testing.
For the database I went with SQLite. It's just a file, no setup needed, 
and for a college project the load is going to be tiny anyway.
Login uses JWT tokens. I learned that part from a YouTube tutorial honestly. 
The passwords are hashed with bcrypt.
The frontend is plain HTML, CSS, and JavaScript. No React, no build step. 
I wanted to keep it simple so I could actually understand what's going on 
instead of fighting with webpack.
Folder setup
backend/
  main.py          - the actual FastAPI app, all routes here
  database.py      - just sets up SQLite connection
  models.py        - database tables (Admin and Event)
  schemas.py       - pydantic stuff for request/response
  auth.py          - login logic, JWT, password hashing
  requirements.txt
  frontend/        - the html/css/js files, served by FastAPI
Running it on your own machine
Clone it:
   git clone https://github.com/kartikideore/hackathon-platform.git
    cd hackathon-platform/backend
Make a virtual environment:
  python -m venv venv
   venv\Scripts\activate        (on Windows)
    source venv/bin/activate     (on Mac/Linux)
Install everything:
  pip install -r requirements.txt
Start the server:
   uvicorn main:app --reload --port 5000
Then open http://localhost:5000
 Logging in
Default admin account:
    email:    admin@college.edu
    password: StrongPass123!
You can change these in the `.env` file, or if it's already deployed, 
in the Render environment variables.
 Some things I want to add later
- Event dates and deadlines (right now there's no date, just a link)
- Maybe some kind of student signup so people can "save" events
- An event description field, right now it's just the name
- Search bar maybe
- Dark mode
 Tech I used
Python, FastAPI, SQLAlchemy, SQLite, JWT, bcrypt, HTML, CSS, 
plain JavaScript, Git, Render for hosting.
Me
Kartiki Deore
GitHub: https://github.com/kartikideore
If you find any bugs or have suggestions, open an issue. 
I'm still learning so feedback is welcome.
