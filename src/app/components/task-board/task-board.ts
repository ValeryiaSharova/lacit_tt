import { Component, computed, inject, signal } from '@angular/core';
import { TaskStatus } from '../../models/task';
import { TaskService } from '../../services/task.service';
import { TaskBoardSectionComponent } from '../task-board-section/task-board-section';
import { TaskCreateModalComponent } from '../task-create-modal/task-create-modal';

@Component({
  selector: 'app-task-board',
  imports: [TaskBoardSectionComponent, TaskCreateModalComponent],
  templateUrl: './task-board.html',
  styleUrl: './task-board.css',
})
export class TaskBoardComponent {
  private readonly taskService = inject(TaskService);

  protected readonly isCreateModalOpen = signal(false);

  protected readonly TaskStatus = TaskStatus;

  protected readonly todoDropListId = 'task-board-todo';

  protected readonly doneDropListId = 'task-board-done';

  protected readonly todoTasks = computed(() =>
    this.taskService.tasks().filter((task) => task.status === TaskStatus.Todo),
  );

  protected readonly doneTasks = computed(() =>
    this.taskService.tasks().filter((task) => task.status === TaskStatus.Done),
  );

  protected openCreateModal(): void {
    this.isCreateModalOpen.set(true);
  }

  protected closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }
}
