import { Component, inject, output, signal } from '@angular/core';
import { form, FormField, submit } from '@angular/forms/signals';
import {
  applyTaskTextRules,
  taskDescriptionMaxLength,
  taskTitleMaxLength,
} from '../../forms/task-text-rules';
import { TaskService } from '../../services/task.service';

type TaskDraft = {
  title: string;
  description: string;
};

const emptyTaskDraft = (): TaskDraft => ({
  title: '',
  description: '',
});

@Component({
  selector: 'app-task-create-modal',
  imports: [FormField],
  templateUrl: './task-create-modal.html',
  styleUrl: './task-create-modal.css',
})
export class TaskCreateModalComponent {
  private readonly taskService = inject(TaskService);

  readonly closed = output<void>();

  protected readonly titleMaxLength = taskTitleMaxLength;
  protected readonly descriptionMaxLength = taskDescriptionMaxLength;

  private readonly taskModel = signal(emptyTaskDraft());

  protected readonly taskForm = form(this.taskModel, (schemaPath) => {
    applyTaskTextRules(schemaPath);
  });

  protected dismiss(): void {
    this.closed.emit();
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();

    void submit(this.taskForm, {
      action: async (field) => {
        const { title, description } = field().value();
        this.taskService.addTask(title, description);
        field().reset(emptyTaskDraft());
        this.closed.emit();
      },
    });
  }
}
