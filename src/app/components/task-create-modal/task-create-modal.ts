import { Component, inject, output, signal } from '@angular/core';
import { form, FormField, maxLength, minLength, required, submit } from '@angular/forms/signals';
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

  private readonly taskModel = signal(emptyTaskDraft());

  protected readonly taskForm = form(this.taskModel, (schemaPath) => {
    required(schemaPath.title, { message: 'Введите заголовок' });
    minLength(schemaPath.title, 1, { message: 'Минимум 1 символ' });
    maxLength(schemaPath.title, 20, { message: 'Максимум 20 символов' });
    maxLength(schemaPath.description, 200, { message: 'Максимум 200 символов' });
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
