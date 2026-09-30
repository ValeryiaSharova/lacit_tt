import { CdkDrag, CdkDragDrop, CdkDragPlaceholder, CdkDragPreview, CdkDropList } from '@angular/cdk/drag-drop';
import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Task, TaskStatus } from '../../models/task';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-task-board-section',
  imports: [RouterLink, CdkDropList, CdkDrag, CdkDragPlaceholder, CdkDragPreview],
  templateUrl: './task-board-section.html',
  styleUrl: './task-board-section.css',
})
export class TaskBoardSectionComponent {
  private readonly taskService = inject(TaskService);

  readonly heading = input.required<string>();
  readonly tasks = input.required<Task[]>();
  readonly status = input.required<TaskStatus>();
  readonly dropListId = input.required<string>();
  readonly connectedDropListIds = input.required<string[]>();

  protected readonly TaskStatus = TaskStatus;

  protected readonly headingId = computed(() => `task-board-section-${this.status()}`);

  protected onTaskDropped(event: CdkDragDrop<Task[]>): void {
    const task = event.item.data;

    if (!task) {
      return;
    }

    const targetStatus = this.status();

    if (task.status === targetStatus) {
      return;
    }

    this.taskService.updateTask(task.uuid, { status: targetStatus });
  }
}
