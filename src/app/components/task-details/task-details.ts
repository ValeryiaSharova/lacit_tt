import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { form, FormField, submit } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import {
  applyTaskTextRules,
  taskDescriptionMaxLength,
  taskTitleMaxLength,
} from '../../forms/task-text-rules';
import { TaskStatus } from '../../models/task';
import { TaskService } from '../../services/task.service';

type TaskEditDraft = {
  title: string;
  description: string;
  status: TaskStatus;
};

const emptyEditDraft = (): TaskEditDraft => ({
  title: '',
  description: '',
  status: TaskStatus.Todo,
});

@Component({
  selector: 'app-task-details',
  imports: [RouterLink, FormField],
  templateUrl: './task-details.html',
  styleUrl: './task-details.css',
})
export class TaskDetailsComponent {
  private readonly taskService = inject(TaskService);
  private readonly router = inject(Router);

  readonly uuid = input.required<string>();

  protected readonly TaskStatus = TaskStatus;
  protected readonly titleMaxLength = taskTitleMaxLength;
  protected readonly descriptionMaxLength = taskDescriptionMaxLength;

  protected readonly task = computed(() =>
    this.taskService.tasks().find((item) => item.uuid === this.uuid()),
  );

  protected readonly statusLabels: Record<TaskStatus, string> = {
    [TaskStatus.Todo]: 'Не готово',
    [TaskStatus.Done]: 'Готово',
  };

  private readonly editModel = signal(emptyEditDraft());
  private readonly editingUuid = linkedSignal<string, string | null>({
    source: this.uuid,
    computation: () => null,
  });

  protected readonly editing = computed(() => {
    const current = this.task();
    return current !== undefined && this.editingUuid() === current.uuid;
  });

  protected readonly taskForm = form(this.editModel, (schemaPath) => {
    applyTaskTextRules(schemaPath);
  });

  protected startEditing(): void {
    const current = this.task();

    if (!current) {
      return;
    }

    this.taskForm().reset(this.draftFrom(current));
    this.editingUuid.set(current.uuid);
  }

  protected confirmAndDelete(): void {
    const current = this.task();

    if (!current || this.editing()) {
      return;
    }

    if (!window.confirm('Вы уверены, что хотите удалить эту задачу?')) {
      return;
    }

    this.taskService.deleteTask(current.uuid);
    void this.router.navigateByUrl('/');
  }

  protected cancelEditing(): void {
    const current = this.task();

    if (current) {
      this.taskForm().reset(this.draftFrom(current));
    }

    this.editingUuid.set(null);
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();

    const current = this.task();

    if (!current || current.uuid !== this.editingUuid()) {
      return;
    }

    void submit(this.taskForm, {
      action: async (field) => {
        const { title, description, status } = field().value();
        this.taskService.updateTask(current.uuid, { title, description, status });
        this.editingUuid.set(null);
      },
    });
  }

  private draftFrom(task: {
    title: string;
    description: string;
    status: TaskStatus;
  }): TaskEditDraft {
    return {
      title: task.title,
      description: task.description,
      status: task.status,
    };
  }
}
