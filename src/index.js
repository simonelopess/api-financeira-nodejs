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

//verifica se o saldo em conta é suficiente para realizar saque
function getBalance(statement) {
    const balance =  statement.reduce((acc, operation) => {
        if(operation.type === 'credit') {
            return acc + operation.amount;
        } else {
            return acc - operation.amount;
        }
    }, 0);

    return balance;
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
});


//logica de saque com saldo em conta
app.post('/withdraw', verifyExistsAccountCPF, (request, response) => {
    
    const { amount } = request.body;
    const {customer}  = request;


    const balance = getBalance(customer.statement);

    if (balance < amount ) {
        return response.status(400).json({error: 'Insuficiente funds!'})
    }

    const statementOperation = {
        amount, 
        created_at: new Date(),
        type: 'debit'
    }    

    customer.statement.push(statementOperation);

    return response.status(201).send();

})

//Lista extrato bancário por data
app.get('/statement/date', verifyExistsAccountCPF ,(request, response) => {    
    const { customer } = request;
    const {date} = request.query;
    
    const dateFormat = new Date(date + " 00:00");

    const statement = customer.statement.filter((statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString) // formata data
    
    return response.json(statement);
})

//Atualiza dado do cliente
app.put('/account', verifyExistsAccountCPF,(request, response) => {
    const { name } = request.body;
    const { customer } = request;

    customer.name = name;

    return response.status(200).send();
})

//

app.get('/account', verifyExistsAccountCPF, (request, response) => {
    const {customer} = request;

    return response.json(customer);
})
app.listen(3333);

