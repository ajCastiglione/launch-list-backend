# Checklist backend

This will be the API for the frontend checklist application built in React.

<h2>The schemas will be as follows:</h2>
<ul>
<li>User Schema
<ul>
<li>email: string</li>
<li>password: string</li>
<li>tokens (JWT): array</li>
</ul>
</li>
<li>Checklist Schema (may need 1 per type of list, hopefully not)
<ul>
<li>text: string</li>
<li>completed: boolean</li>
<li>completedAt: number</li>
<li>_creator: mongoose Object ID</li>
</ul>
</li>
</ul>
