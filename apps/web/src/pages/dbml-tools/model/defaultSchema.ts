export const DEFAULT_DBML_SCHEMA = `Table users {
  id int [pk, increment]
  email varchar [unique, not null]
  created_at timestamp [default: \`now()\`]
}

Table projects {
  id int [pk]
  user_id int [ref: > users.id]
  name varchar
  status varchar [note: 'active | archived']
}

Table tasks {
  id int [pk]
  project_id int [ref: > projects.id]
  title text
  completed bool [default: false]
}
`;
