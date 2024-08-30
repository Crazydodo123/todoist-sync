import { TodoistApi } from "@doist/todoist-api-typescript"
import { configDotenv } from "dotenv"

configDotenv({ path: '../.env'})

const api = new TodoistApi(process.env.API_KEY)

const getProjects = async () => {
    return await api.getProjects()
}

const getAllTasks = async () => {
    const projects = await getProjects()
    let taskList = {}

    for (const project of projects) {
        taskList[project.name] = []

        const tasks = await api.getTasks({ projectId: project.id})
        tasks.forEach(task => {
            taskList[project.name].push(task.content)
        })
    }

    return taskList
}


export default { getProjects, getAllTasks }