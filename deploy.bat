@ECHO OFF
ECHO deploying...
ECHO(
IF "%1" == "backend" (
  ::deploy backend
  cd backend && eb deploy && cd ..
) ELSE IF "%1" == "frontend" (
  ::deploy frontend
  cd frontend && npm run build && aws s3 sync ./build s3://adventurizer.net/ && cd ..
) ELSE (
  ::deploy backend
  cd backend && eb deploy && cd ..
  ::deploy frontend
  cd frontend && npm run build && aws s3 sync ./build s3://adventurizer.net/ && cd ..
)