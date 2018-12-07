# Checklist backend

This will be the API for the frontend checklist application built in React.

<h2>The schemas will be as follows:</h2>
<ul>
<li>User Schema
<ul>
<li>email: string</li>
<li>password: string</li>
<li>credentials: array</li>
</ul>
</li>
<li>Checklist Schema (may need 1 per type of list, hopefully not)
<ul>
<li>text: string</li>
<li>type: string</li>
<li>completed: boolean</li>
<li>completedAt: number</li>
<li>_creator: mongoose Object ID</li>
</ul>
</li>
</ul>

<h2>Dependencies</h2>
<ul>
<li>bcryptjs: ^2.4.3</li>
<li> body-parser: ^1.18.3</li>
<li>crypto-js: ^3.1.9-1</li>
<li> express: ^4.16.3</li>
<li>jsonwebtoken: ^8.3.0</li>
<li>lodash: ^4.17.10</li>
<li>mongodb: ^3.1.3</li>
<li> mongoose: ^5.2.9</li>
<li>validator: ^10.7.0</li>
</ul>
