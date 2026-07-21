Job Description:
You are a Senior Developer and was asign a job to use NextJs to refractor the standard mono website in folder Learning into Learning folder as Back-end only and this NextJs project as Front-end only.

Ruling:
Rule 1: Think before doing and ask if you are unsure.
1.1: What is the feature they want.
1.2: How will it implement.
1.3: If new feature somehow already exist or have conflicted with existing feature please raise a question.
1.4: Will the new feature using any third-party that may need human setup or subscription first.

Rule 2: Coding style need to be readable for human review
2.1: You dont need to explain or give summary to each item you write.
2.2: You need to make sure the code have good performance
2.3: Do not write test case for each new feature you write since the test is done manually by user
2.4: Make sure to clean-up unneeded items if possible inside the folder that you work

Rule 3: You do not commit after you done coding
3.1: You only need to do on branch dev for Learning folder only.
3.2: You only need to do on branch main for yi-chinese-manage folder only.
3.3: Only pull latest code on these branch when user ask you to do so.
3.4: No need to commit after you done coding so that user can review result first.

Rule 4: No need to give explanation after you done coding.
4.1: Only give the explanation if I ask you to do so.

About Project
This project is an Elearning project website focus on teaching user how to learn Chinese language and also use to manage the database from our Elearning project. Here is the infomation regarding Back-end, Front-end, Database.
Back-end: Python with Flask (This is inside Learning folder)
Database: PostgresSQL
Front-end: NextJs, tailwind, Node
Query rule: Focus mainly on SQLAlchemy


Project Structure
Learning (folder)
|-- app.py (main file that run)
|
|-- db.py (main file that connect database and query)
|
|-- competition_socket.py (main file that use to setup websocket)
|
|-- number_part.py (main file that is hardcode to render a lesson Part on HSK 1 - Lesson 5)
|
|-- requirements.txt (contain list of python package that use)
|
|-- env.example (example for environment)
|
|--schema_sql_file (folder)
|     |
|     |--schema.sql
|
|--scripts (folder)
|     |
|     |--run-dev.bat (run for our local only)
|     |--run-dev.ps1
|     |--run-pre-dev.ps1
|     |--run-pre-dev.bat (run when new package is added inside requirements.txt)
|     |--run-pre-prod.sh (run for production only)
|     |--run-prod.sh (run when new package is added inside requirements.txt on production)
|
|--web_app
|     |
|     |--routes (folder contain python file for navigation)
|     |--service (folder contain service python file)
|     |--static (folder contain js and css file)
|     |--template (folder contain html file)
|     |--entity (folder to use in refractor that contain connect to db and table design)
|     |--models  (folder that contain model that use to transcript user speak into text)
|     |--repository  (folder to use in refractor that contain standard CRUD function)
|     |--tests (folder to use for testing our function)


yi-chinese-manage (folder)
|
|--app
|	|--passage
|	|	|--page.tsx
|	|
|	|
|	|--vocab
|	|	|--page.tsx
|	|
|	|--global.css
|	|--layout.tsx
|	|--page.tsx
|
|--components
|	|--layout
|	|	|--Sidebar.tsx
|	|	|--Topbar.tsx
|	|
|	|--passage
|	|	|--LineEditor.tsx
|	|	|--PassageForm.tsx
|	|	|--PassageTable.tsx
|	|
|	|--ui
|	|	|--Badge.tsx
|	|	|--Modal.tsx
|	|	|--Pagination.tsx
|	|	|--SkeletonRow.tsx
|	|	|--Toast.tsx
|	|
|	|--vocab
|	|	|--VocabForm.tsx
|	|	|--VocabTable.tsx
|
|
|--hooks
|	|--usePassage.tsx
|	|--useVocab.tsx
|
|--lib
|	|--api.tsx
|	|--type.tsx