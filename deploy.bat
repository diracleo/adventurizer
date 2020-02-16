::start backend
start cmd.exe /k "cd backend && venv\Scripts\activate && set FLASK_APP=application.py && SET FLASK_ENV=development && SET FLASK_DEBUG=1 && flask run"
::start frontend
start cmd.exe /k "cd frontend && npm start"
::start database
::start cmd.exe /k "C: && cd Program Files\MongoDB\Server\4.2\bin && mongod.exe"