import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TaskStatus } from '../../models/task';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-task-details',
  imports: [RouterLink],
  templateUrl: './task-details.html',
  styleUrl: './task-details.css',
})
export class TaskDetailsComponent {
  private readonly taskService = inject(TaskService);

  readonly uuid = input.required<string>();

  protected readonly TaskStatus = TaskStatus;

  protected readonly task = computed(() =>
    this.taskService.tasks().find((item) => item.uuid === this.uuid()),
  );

  protected readonly statusLabels: Record<TaskStatus, string> = {
    [TaskStatus.Todo]: 'Не готово',
    [TaskStatus.Done]: 'Готово',
  };
}
