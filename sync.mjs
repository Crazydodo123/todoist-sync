import { TodoistApi } from "@doist/todoist-api-typescript"

const api = new TodoistApi("test")

api.getProjects()
    .then((projects) => 
        projects.forEach(project => {
            api.getTasks({ project_id: project.id })
                .then(tasks => {
                    tasks.forEach(task => {
                        console.log(`${project.name}: ${task.content}`)
                    })
                })
        }))
    .catch((error) => console.log(error))