const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(express.json());

const customers = [];

//Midleware

function verifyExistsAccountCPF(request, response, next) {
    const { cpf } = request.headers;

    //verifica se existe um extrato bancário do cliente
    const customer = customers.find(customer => customer.cpf === cpf);

    if(!customer) {
        return response.status(400).json({ error: 'Customer not found'})
    }

    request.customer = customer; //repassa o customer para os recursos
    return next();

}


app.post('/account', (request, response) => {
    const { cpf, name } = request.body;
    
    const customerAlreadyExists = customers.some((customer) => customer.cpf === cpf);

    //verifica se cpf é existente
    if (customerAlreadyExists) {
        return response.status(400).json({
            error: "Customer already exists"
        })
    }
    
       customers.push({
        cpf, 
        name,
        id: uuidv4(),
        statement: []
    })

    return response.status(201).send()
})


app.get('/statement', verifyExistsAccountCPF ,(request, response) => {    
    const { customer } = request;
    return response.json(customer.statement);
})

app.post('/deposit', verifyExistsAccountCPF, (request, response)=> {
    const {description, amount} = request.body;

    const { customer } = request;

    const statementOperation = {
        description, 
        amount, 
        created_at: new Date(),
        type: 'credit'
    }

    customer.statement.push(statementOperation);

    return response.status(201).send();
})
app.listen(3333);

