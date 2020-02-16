@ECHO OFF
ECHO deploying...
ECHO(
IF "%1" == "backend" (
  ::deploy backend
  cd backend && eb deploy && echo deployed! && cd ..
) ELSE IF "%1" == "frontend" (
  ::deploy frontend
  cd frontend && npm run build && aws s3 sync ./build s3://adventurizer.net/ && echo deployed! && cd ..
) ELSE (
  ::deploy backend
  cd backend && eb deploy && echo deployed! && cd ..
  ::deploy frontend
  cd frontend && npm run build && aws s3 sync ./build s3://adventurizer.net/ && echo deployed! && cd ..
)
ECHO(
ECHO deployed!