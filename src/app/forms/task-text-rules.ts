import { maxLength, minLength, required, type SchemaPathTree } from '@angular/forms/signals';

export const taskTitleMaxLength = 20;
export const taskDescriptionMaxLength = 200;

type TaskTextFields = {
  title: string;
  description: string;
};

export function applyTaskTextRules<T extends TaskTextFields>(path: SchemaPathTree<T>): void {
  required(path.title, { message: 'Введите заголовок' });
  minLength(path.title, 1, { message: 'Минимум 1 символ' });
  maxLength(path.title, taskTitleMaxLength, { message: 'Максимум 20 символов' });
  maxLength(path.description, taskDescriptionMaxLength, {
    message: 'Максимум 200 символов',
  });
}
