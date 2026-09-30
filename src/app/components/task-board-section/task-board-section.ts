import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Task, TaskStatus } from '../../models/task';

@Component({
  selector: 'app-task-board-section',
  imports: [RouterLink],
  templateUrl: './task-board-section.html',
  styleUrl: './task-board-section.css',
})
export class TaskBoardSectionComponent {
  readonly heading = input.required<string>();
  readonly tasks = input.required<Task[]>();
  readonly status = input.required<TaskStatus>();

  protected readonly TaskStatus = TaskStatus;

  protected readonly headingId = computed(() => `task-board-section-${this.status()}`);
}
