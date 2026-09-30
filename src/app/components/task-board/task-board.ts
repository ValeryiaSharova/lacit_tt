import { Component, computed, inject } from '@angular/core';
import { TaskStatus } from '../../models/task';
import { TaskService } from '../../services/task.service';
import { TaskBoardSectionComponent } from '../task-board-section/task-board-section';

@Component({
  selector: 'app-task-board',
  imports: [TaskBoardSectionComponent],
  templateUrl: './task-board.html',
  styleUrl: './task-board.css',
})
export class TaskBoardComponent {
  private readonly taskService = inject(TaskService);

  protected readonly TaskStatus = TaskStatus;

  protected readonly todoTasks = computed(() =>
    this.taskService.tasks().filter((task) => task.status === TaskStatus.Todo),
  );

  protected readonly doneTasks = computed(() =>
    this.taskService.tasks().filter((task) => task.status === TaskStatus.Done),
  );
}
